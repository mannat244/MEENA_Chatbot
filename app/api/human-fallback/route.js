import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HumanFallback from '@/models/HumanFallback';

// Keep local storage as backup (dual storage approach)
let fallbackRequests = [];
let nextId = 1;

// GET - Fetch all human fallback requests
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    
    // Filter requests
    let filteredRequests = fallbackRequests;
    if (status !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }
    if (category !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.category === category);
    }
    
    // Sort by creation date (newest first)
    filteredRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const totalCount = filteredRequests.length;
    const skip = (page - 1) * limit;
    const paginatedRequests = filteredRequests.slice(skip, skip + limit);
    
    // Calculate stats from local storage
    const localStats = fallbackRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    // Also get MongoDB total count for admin info
    let mongoStats = { total: 0, stored: 'Not available' };
    try {
      await dbConnect();
      const mongoCount = await HumanFallback.countDocuments();
      mongoStats = { 
        total: mongoCount, 
        stored: `${mongoCount} requests permanently stored`,
        connection: 'Connected'
      };
    } catch (mongoError) {
      console.log('MongoDB stats query failed:', mongoError.message);
      mongoStats.stored = 'MongoDB connection failed';
      mongoStats.connection = 'Failed';
    }
    
    return NextResponse.json({
      success: true,
      data: {
        requests: paginatedRequests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        stats: {
          ...localStats,
          local: {
            total: fallbackRequests.length,
            active: 'Live data from memory'
          },
          mongodb: mongoStats
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching human fallback requests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch human fallback requests'
    }, { status: 500 });
  }
}

// POST - Create new human fallback request (Dual Storage: Local + MongoDB)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      query,
      userContact,
      originalResponse,
      context,
      category = 'general',
      priority = 'medium',
      metadata = {}
    } = body;
    
    // Validate required fields
    if (!query || !userContact?.phone || !originalResponse) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: query, userContact.phone, originalResponse'
      }, { status: 400 });
    }
    
    // Create new fallback request (LOCAL STORAGE)
    const fallbackRequest = {
      id: nextId++,
      _id: `fallback_${nextId - 1}`, // For compatibility with existing code
      query: query.trim(),
      userContact,
      originalResponse,
      context,
      category,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    };
    
    // Save to LOCAL STORAGE (keeps working)
    fallbackRequests.push(fallbackRequest);
    
    // ALSO save to MongoDB for admin dashboard persistence
    try {
      await dbConnect();
      const mongoFallback = await HumanFallback.create({
        query: fallbackRequest.query,
        userContact: fallbackRequest.userContact,
        originalResponse: fallbackRequest.originalResponse,
        context: fallbackRequest.context,
        category: fallbackRequest.category,
        priority: fallbackRequest.priority,
        status: fallbackRequest.status,
        metadata: fallbackRequest.metadata
      });
      console.log('✅ Fallback saved to MongoDB:', mongoFallback._id);
    } catch (mongoError) {
      console.error('⚠️ MongoDB save failed (local storage still works):', mongoError.message);
      // Don't fail the request - local storage still works
    }
    
    // Send notification to admin (via Telegram if configured)
    try {
      await notifyAdminOfNewFallback(fallbackRequest);
    } catch (notifyError) {
      console.error('Failed to notify admin:', notifyError);
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: fallbackRequest._id,
        message: 'Your query has been forwarded to our human experts. We will contact you within 24 hours.',
        estimatedResponse: '24 hours'
      }
    });
    
  } catch (error) {
    console.error('Error creating human fallback request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create human fallback request'
    }, { status: 500 });
  }
}

// PUT - Update fallback request (admin response)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, adminResponse, status, respondedBy } = body;
    
    if (!id || !adminResponse) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: id, adminResponse'
      }, { status: 400 });
    }
    
    // Find and update the request in memory
    const requestIndex = fallbackRequests.findIndex(req => req._id === id || req.id.toString() === id);
    
    if (requestIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Fallback request not found'
      }, { status: 404 });
    }
    
    // Update the request in LOCAL STORAGE
    const updatedRequest = {
      ...fallbackRequests[requestIndex],
      adminResponse: {
        content: adminResponse,
        respondedBy: respondedBy || 'Admin',
        respondedAt: new Date().toISOString()
      },
      status: status || 'resolved',
      updatedAt: new Date().toISOString()
    };
    
    fallbackRequests[requestIndex] = updatedRequest;
    
    // ALSO update in MongoDB for persistence
    try {
      await dbConnect();
      await HumanFallback.findOneAndUpdate(
        { 
          $or: [
            { _id: id },
            { query: updatedRequest.query, 'userContact.phone': updatedRequest.userContact.phone }
          ]
        },
        {
          adminResponse: updatedRequest.adminResponse,
          status: updatedRequest.status,
          updatedAt: updatedRequest.updatedAt
        },
        { new: true }
      );
      console.log('✅ Admin response updated in MongoDB');
    } catch (mongoError) {
      console.error('⚠️ MongoDB update failed (local storage still updated):', mongoError.message);
      // Don't fail - local storage is already updated
    }
    
    // Send response to user via their preferred platform
    try {
      await sendResponseToUser(updatedRequest);
    } catch (sendError) {
      console.error('Failed to send response to user:', sendError);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Response sent successfully'
    });
    
  } catch (error) {
    console.error('Error updating human fallback request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update human fallback request'
    }, { status: 500 });
  }
}

// Helper function to notify admin of new fallback request
async function notifyAdminOfNewFallback(fallbackRequest) {
  try {
    // Get bot config for Telegram notifications
    const botConfigResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bots/config`);
    
    if (!botConfigResponse.ok) return;
    
    const { config } = await botConfigResponse.json();
    const telegramToken = config?.telegram?.botToken;
    const adminChatId = config?.telegram?.adminChatId; // Admin's Telegram chat ID
    
    if (!telegramToken || !adminChatId) return;
    
    const message = `🚨 *New Human Fallback Request*
    
📝 *Query:* ${fallbackRequest.query}
📱 *Phone:* ${fallbackRequest.userContact.phone}
👤 *Name:* ${fallbackRequest.userContact.name || 'Not provided'}
🏷️ *Category:* ${fallbackRequest.category}
⚡ *Priority:* ${fallbackRequest.priority}
🕐 *Time:* ${new Date(fallbackRequest.createdAt).toLocaleString('en-IN')}

💬 *Original Response:* ${fallbackRequest.originalResponse}

🔗 *Dashboard:* ${process.env.NEXTAUTH_URL}/admin/fallback`;
    
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { 
              text: '📝 Reply', 
              callback_data: `fallback_reply_${fallbackRequest._id}` 
            },
            { 
              text: '📊 Dashboard', 
              url: `${process.env.NEXTAUTH_URL}/admin/fallback` 
            }
          ]]
        }
      })
    });
    
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}

// Helper function to send response back to user
async function sendResponseToUser(fallbackRequest) {
  const { userContact, adminResponse, context } = fallbackRequest;
  
  // If user contacted via Telegram, send response via Telegram
  if (userContact.chatId && context?.platform === 'telegram') {
    try {
      const botConfigResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bots/config`);
      
      if (botConfigResponse.ok) {
        const { config } = await botConfigResponse.json();
        const telegramToken = config?.telegram?.botToken;
        
        if (telegramToken) {
          const responseMessage = `👨‍💼 *Response from Human Expert*

📝 *Your Query:* ${fallbackRequest.query}

💡 *Expert Response:*
${adminResponse.content}

📞 Need more help? Contact: ${userContact.phone}
🕐 Responded at: ${new Date(adminResponse.respondedAt).toLocaleString('en-IN')}

Thank you for using MEENA! 🤖`;

          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: userContact.chatId,
              text: responseMessage,
              parse_mode: 'Markdown'
            })
          });
        }
      }
    } catch (error) {
      console.error('Error sending Telegram response:', error);
    }
  }
  
  // For WhatsApp, you could integrate with WhatsApp Business API here
  // For web users, you could send an email or SMS notification
}