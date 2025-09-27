(function() {
    // Get widget configuration from script attributes
    const script = document.querySelector('script[data-meena-iframe]');
    if (!script) return;
    
    const config = {
        apiUrl: script.getAttribute('data-api-url') || window.location.origin,
        title: script.getAttribute('data-title') || 'MEENA Assistant',
        width: script.getAttribute('data-width') || '400px',
        height: script.getAttribute('data-height') || '600px',
        position: script.getAttribute('data-position') || 'bottom-right',
        primaryColor: script.getAttribute('data-primary-color') || '#3B82F6'
    };

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'meena-iframe-widget';
    
    // Position styles based on config
    const positionStyles = {
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;',
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;'
    };

    widgetContainer.style.cssText = `
        position: fixed;
        ${positionStyles[config.position]}
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s ease;
    `;

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;
    toggleButton.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: ${config.primaryColor};
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.style.cssText = `
        width: ${config.width};
        height: ${config.height};
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        overflow: hidden;
        display: none;
        margin-bottom: 10px;
        border: 1px solid #e5e7eb;
    `;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${config.apiUrl}/?embedded=true`;
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
    `;
    iframe.setAttribute('allowfullscreen', '');

    // Add header to iframe container
    const header = document.createElement('div');
    header.style.cssText = `
        background: ${config.primaryColor};
        color: white;
        padding: 12px 16px;
        font-weight: 500;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>${config.title}</span>
        <button id="meena-close-btn" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    // Create iframe content container
    const iframeContent = document.createElement('div');
    iframeContent.style.cssText = `
        height: calc(100% - 48px);
    `;
    iframeContent.appendChild(iframe);

    // Assemble iframe container
    iframeContainer.appendChild(header);
    iframeContainer.appendChild(iframeContent);

    // Assemble widget
    widgetContainer.appendChild(iframeContainer);
    widgetContainer.appendChild(toggleButton);

    // Toggle functionality
    let isOpen = false;
    
    function toggleWidget() {
        isOpen = !isOpen;
        if (isOpen) {
            iframeContainer.style.display = 'block';
            toggleButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        } else {
            iframeContainer.style.display = 'none';
            toggleButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            `;
        }
    }

    toggleButton.addEventListener('click', toggleWidget);
    
    // Close button functionality
    header.querySelector('#meena-close-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        toggleWidget();
    });

    // Hover effects
    toggleButton.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });

    toggleButton.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    // Add to page
    document.body.appendChild(widgetContainer);

    // Add mobile responsiveness
    function handleResize() {
        if (window.innerWidth <= 768) {
            iframeContainer.style.width = '320px';
            iframeContainer.style.height = '500px';
        } else {
            iframeContainer.style.width = config.width;
            iframeContainer.style.height = config.height;
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
})();