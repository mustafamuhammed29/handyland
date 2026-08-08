const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Helper to fetch image buffer from URL or local path
const fetchImageBuffer = async (url) => {
    if (!url) return null;
    
    // If it's a relative URL, it might be stored locally in /public or /uploads
    if (url.startsWith('/')) {
        // Try 'uploads' or 'public'
        const possiblePaths = [
            path.join(__dirname, '..', url),
            path.join(__dirname, '..', 'public', url)
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return fs.readFileSync(p);
            }
        }
        // If not found locally, try fetching via localhost
        url = `http://127.0.0.1:${process.env.PORT || 5000}${url}`;
    }

    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode !== 200) {
                resolve(null);
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', () => {
            resolve(null);
        });
    });
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
};

exports.generatePDF = async (doc, order, settings) => {
    const s = settings || {};
    const primaryColor = s.primaryColor || '#00bcd4';
    const primaryRgb = hexToRgb(primaryColor);
    
    // Typography defaults
    const fontRegular = 'Helvetica';
    const fontBold = 'Helvetica-Bold';
    
    // Labels
    const titleLabel = s.titleLabel || 'INVOICE';
    const dateLabel = s.dateLabel || 'Date:';
    const numberLabel = s.numberLabel || 'Invoice #:';
    const vatIdLabel = s.vatIdLabel || 'VAT ID:';
    
    const itemLabel = s.itemLabel || 'Item';
    const quantityLabel = s.quantityLabel || 'Qty';
    const priceLabel = s.priceLabel || 'Price';
    const totalLabel = s.totalLabel || 'Total';
    
    const subtotalLabel = s.subtotalLabel || 'Subtotal:';
    const taxLabel = s.taxLabel || 'VAT';
    const shippingLabel = s.shippingLabel || 'Shipping:';
    const discountLabel = s.discountLabel || 'Discount:';
    const totalSumLabel = s.totalLabel || 'Total:';
    
    const footerText = s.footerText || 'Thank you for your business!';
    const companyAddress = s.companyAddress || 'HandyLand GmbH';

    // Fetch logo if exists
    let logoBuffer = null;
    if (s.logoUrl) {
        logoBuffer = await fetchImageBuffer(s.logoUrl);
    }

    // ── HEADER ──
    const margin = 50;
    let y = margin;
    
    if (logoBuffer) {
        try {
            const logoHeight = s.logoHeight || 40;
            doc.image(logoBuffer, margin, y, { height: logoHeight });
        } catch (e) {
            console.error("Failed to render logo", e);
            doc.font(fontBold).fontSize(20).fillColor('#333333').text(s.companyName || 'HandyLand', margin, y);
        }
    } else {
        doc.font(fontBold).fontSize(24).fillColor('#333333').text(s.companyName || 'HandyLand', margin, y);
    }

    // Right-aligned header info
    doc.font(fontBold).fontSize(24).fillColor(primaryRgb).text(titleLabel.toUpperCase(), 350, y, { align: 'right', width: 200 });
    
    y += 30;
    doc.font(fontRegular).fontSize(10).fillColor('#64748b');
    doc.text(`${dateLabel} ${new Date(order.created_at).toLocaleDateString()}`, 350, y, { align: 'right', width: 200 });
    y += 15;
    doc.text(`${numberLabel} ${s.prefix || 'HL-'}${order.order_number}`, 350, y, { align: 'right', width: 200 });
    y += 15;
    if (s.vatNumber) {
        doc.text(`${vatIdLabel} ${s.vatNumber}`, 350, y, { align: 'right', width: 200 });
        y += 15;
    }

    // Header line
    y = Math.max(y, margin + (s.logoHeight || 40)) + 20;
    doc.moveTo(margin, y).lineTo(550, y).lineWidth(2).strokeColor('#e2e8f0').stroke();
    y += 20;

    // ── ADDRESSES ──
    const addressY = y;
    
    // Billing Address
    doc.font(fontBold).fontSize(10).fillColor('#94a3b8').text('RECHNUNGSADRESSE:', margin, addressY);
    doc.font(fontRegular).fillColor('#333333');
    let by = addressY + 15;
    doc.text(order.shipping_full_name, margin, by); by += 15;
    doc.text(order.shipping_street, margin, by); by += 15;
    doc.text(`${order.shipping_zip} ${order.shipping_city}`, margin, by); by += 15;
    doc.text(order.shipping_country, margin, by);
    
    // Shipping Address (Optional, defaulting to same for now unless differentiated in DB)
    doc.font(fontBold).fontSize(10).fillColor('#94a3b8').text('LIEFERADRESSE:', 300, addressY);
    doc.font(fontRegular).fillColor('#333333');
    let sy = addressY + 15;
    doc.text(order.shipping_full_name, 300, sy); sy += 15;
    doc.text(order.shipping_street, 300, sy); sy += 15;
    doc.text(`${order.shipping_zip} ${order.shipping_city}`, 300, sy); sy += 15;
    doc.text(order.shipping_country, 300, sy);
    
    y = Math.max(by, sy) + 30;

    // ── TABLE HEADER ──
    doc.rect(margin, y, 500, 30).fill('#f8fafc');
    doc.moveTo(margin, y).lineTo(550, y).lineWidth(1).strokeColor('#e2e8f0').stroke();
    doc.moveTo(margin, y+30).lineTo(550, y+30).stroke();

    y += 10;
    doc.font(fontBold).fontSize(10).fillColor('#64748b');
    doc.text(itemLabel.toUpperCase(), margin + 10, y);
    doc.text(priceLabel.toUpperCase(), 350, y, { width: 60, align: 'right' });
    doc.text(quantityLabel.toUpperCase(), 420, y, { width: 40, align: 'center' });
    doc.text(totalLabel.toUpperCase(), 470, y, { width: 70, align: 'right' });

    y += 25;

    // ── TABLE ITEMS ──
    doc.font(fontRegular).fillColor('#333333');
    const items = order.order_items || [];
    
    items.forEach((item, index) => {
        // Zebra striping (optional, simple bottom border for now)
        const lineY = y + 25;
        
        doc.font(fontBold).text(item.name, margin + 10, y, { width: 280, height: 15, ellipsis: true });
        doc.font(fontRegular).fontSize(8).fillColor('#94a3b8').text(item.product_type || 'Product', margin + 10, y + 12);
        
        doc.fontSize(10).fillColor('#333333');
        doc.text(`${item.price.toFixed(2)} €`, 350, y + 5, { width: 60, align: 'right' });
        doc.text(item.quantity.toString(), 420, y + 5, { width: 40, align: 'center' });
        doc.text(`${(item.price * item.quantity).toFixed(2)} €`, 470, y + 5, { width: 70, align: 'right' });
        
        doc.moveTo(margin, lineY).lineTo(550, lineY).lineWidth(1).strokeColor('#f1f5f9').stroke();
        
        y += 35;
        
        // Add new page if table overflows
        if (y > 700) {
            doc.addPage();
            y = margin;
        }
    });

    y += 10;

    // ── TOTALS ──
    const totalsX = 350;
    
    const subtotal = order.total_amount - order.shipping_fee + (order.discount_amount || 0);
    
    doc.font(fontRegular).fontSize(10).fillColor('#333333');
    doc.text(subtotalLabel, totalsX, y, { width: 120, align: 'left' });
    doc.text(`${subtotal.toFixed(2)} €`, totalsX + 120, y, { width: 70, align: 'right' });
    y += 15;
    
    // Tax (Assuming 19% included in total for Germany, but keeping logic generic)
    // The admin panel just shows 19% VAT of subtotal as an info line.
    const taxRate = settings.taxRate || 19;
    const isZeroTax = settings.zeroTax || false;
    const taxAmount = isZeroTax ? 0 : (subtotal * (taxRate / (100 + taxRate)));
    
    doc.fillColor('#64748b');
    doc.text(`${taxLabel} (${isZeroTax ? '0' : taxRate}%):`, totalsX, y, { width: 120, align: 'left' });
    doc.text(`${taxAmount.toFixed(2)} €`, totalsX + 120, y, { width: 70, align: 'right' });
    y += 15;
    
    doc.fillColor('#333333');
    doc.text(shippingLabel, totalsX, y, { width: 120, align: 'left' });
    doc.text(`${(order.shipping_fee || 0).toFixed(2)} €`, totalsX + 120, y, { width: 70, align: 'right' });
    y += 15;
    
    if (order.discount_amount && order.discount_amount > 0) {
        doc.text(discountLabel, totalsX, y, { width: 120, align: 'left' });
        doc.text(`-${order.discount_amount.toFixed(2)} €`, totalsX + 120, y, { width: 70, align: 'right' });
        y += 15;
    }
    
    // Total Line
    y += 5;
    doc.moveTo(totalsX, y).lineTo(540, y).lineWidth(2).strokeColor('#0f172a').stroke();
    y += 10;
    
    doc.font(fontBold).fontSize(12).fillColor('#0f172a').text(totalSumLabel, totalsX, y, { width: 120, align: 'left' });
    doc.fillColor(primaryRgb).text(`${(order.total_amount || 0).toFixed(2)} €`, totalsX + 120, y, { width: 70, align: 'right' });
    
    // ── FOOTER ──
    const pageBottom = doc.page.height - 100;
    // Always place footer at the bottom of the page
    let footerY = pageBottom;
    
    doc.moveTo(margin, footerY).lineTo(550, footerY).lineWidth(1).strokeColor('#e2e8f0').stroke();
    footerY += 15;
    
    doc.font(fontBold).fontSize(9).fillColor('#334155').text(footerText, margin, footerY, { align: 'center' });
    footerY += 15;
    doc.font(fontRegular).fillColor('#64748b').text(companyAddress, margin, footerY, { align: 'center' });
    footerY += 15;
    
    // Bank details
    const bankParts = [];
    if (s.bankName) bankParts.push(`Bank: ${s.bankName}`);
    if (s.iban) bankParts.push(`IBAN: ${s.iban}`);
    if (s.bic) bankParts.push(`BIC: ${s.bic}`);
    
    if (bankParts.length > 0) {
        doc.moveTo(150, footerY).lineTo(450, footerY).lineWidth(1).strokeColor('#f1f5f9').stroke();
        footerY += 10;
        doc.text(bankParts.join('  |  '), margin, footerY, { align: 'center' });
    }
};
