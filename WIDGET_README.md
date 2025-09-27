# MEENA Widget - Simple Iframe Implementation

## Overview
This is a simplified iframe-based widget that allows any website to embed the full MEENA chat interface with a single script tag.

## Features
✅ **Simple Integration** - Just one `<script>` tag  
✅ **Secure** - Runs in isolated iframe  
✅ **Full Functionality** - Complete MEENA chat experience  
✅ **Customizable** - Size, position, and appearance options  
✅ **Mobile Friendly** - Responsive design  
✅ **Zero Dependencies** - Self-contained JavaScript  

## Quick Start

### 1. Basic Implementation
```html
<script 
  data-meena-iframe 
  data-api-url="https://your-meena-site.com"
  src="https://your-meena-site.com/meena-widget-iframe.js">
</script>
```

### 2. Full Configuration
```html
<script 
  data-meena-iframe 
  data-api-url="https://your-meena-site.com"
  data-title="MEENA Assistant"
  data-primary-color="#3B82F6"
  data-position="bottom-right"
  data-width="400px"
  data-height="600px"
  src="https://your-meena-site.com/meena-widget-iframe.js">
</script>
```

## Configuration Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-api-url` | current domain | Your MEENA installation URL |
| `data-title` | "MEENA Assistant" | Widget title text |
| `data-primary-color` | "#3B82F6" | Primary color (hex) |
| `data-position` | "bottom-right" | Position: bottom-right, bottom-left, top-right, top-left |
| `data-width` | "400px" | Widget width |
| `data-height` | "600px" | Widget height |

## How it Works

1. **Script loads** and reads configuration from data attributes
2. **Floating button** appears on the website
3. **User clicks** button to open chat
4. **Iframe loads** your MEENA site in embedded mode (`?embedded=true`)
5. **Full chat experience** within the iframe

## Admin Dashboard Integration

Use the **Widget Generator** in your MEENA admin dashboard:
1. Go to `/admin` → "Widget Generator" tab
2. Configure appearance and settings
3. Copy generated embed code
4. Paste into target website

## Files Structure

```
public/
├── meena-widget-iframe.js    # The widget script
app/
├── page.js                   # Modified to support ?embedded=true
├── admin/widget/page.js      # Widget generator dashboard
└── widget-demo/page.js       # Demo page
```

## Browser Support
- ✅ Chrome 60+
- ✅ Firefox 55+ 
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## Security
- Iframe provides natural security sandbox
- No access to parent page DOM/data
- Secure cross-origin communication
- No third-party dependencies

## Troubleshooting

**Widget not appearing?**
- Check console for JavaScript errors
- Ensure `data-api-url` is correct
- Verify MEENA site is accessible

**Iframe not loading?**
- Check CORS settings
- Ensure embedded mode works: `yoursite.com/?embedded=true`
- Verify iframe src URL is accessible

**Mobile issues?**
- Widget automatically resizes on mobile
- Uses responsive breakpoints
- Touch-friendly interface

## Advanced Usage

### Custom Styling
The widget respects your MEENA site's styling automatically since it loads the full page in embedded mode.

### Multiple Widgets
You can have multiple widgets with different configurations:
```html
<!-- Widget 1: Support Chat -->
<script 
  data-meena-iframe 
  data-title="Support Chat"
  data-position="bottom-right"
  src="/meena-widget-iframe.js">
</script>

<!-- Widget 2: General Info -->  
<script 
  data-meena-iframe 
  data-title="General Info"
  data-position="bottom-left"
  src="/meena-widget-iframe.js">
</script>
```

### Events & Callbacks
The widget emits custom events:
```javascript
window.addEventListener('meena-widget-opened', function() {
  console.log('MEENA widget opened');
});

window.addEventListener('meena-widget-closed', function() {
  console.log('MEENA widget closed');
});
```

## Deployment Checklist

- [ ] MEENA site supports `?embedded=true` parameter
- [ ] `/meena-widget-iframe.js` is accessible
- [ ] CORS configured for iframe embedding
- [ ] Widget generator available at `/admin` 
- [ ] Demo page works at `/widget-demo`
- [ ] Mobile responsive design tested
- [ ] All target browsers tested

## Support
For issues or questions about the MEENA widget system, please check:
1. Browser console for errors
2. Network tab for failed requests  
3. MEENA admin dashboard for configuration
4. Demo page for reference implementation