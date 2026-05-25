const fs = require('fs');

// 1. Append to cartController.js
let controller = fs.readFileSync('controllers/cartController.js', 'utf8');
const adminClearCartFn = `

// ── @route DELETE /api/cart/admin/:cartId/clear ──────────────
exports.adminClearCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;
        const { supabaseAdmin } = require('../config/supabase');

        const { data: cart, error: cartError } = await supabaseAdmin
            .from('carts')
            .select('id')
            .eq('id', cartId)
            .single();

        if (cartError || !cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        await supabaseAdmin.from('cart_items').delete().eq('cart_id', cartId);
        await supabaseAdmin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);

        return res.status(200).json({ success: true, message: 'Cart cleared successfully' });
    } catch (error) {
        next(error);
    }
};
`;
if (!controller.includes('exports.adminClearCart')) {
    fs.writeFileSync('controllers/cartController.js', controller + adminClearCartFn);
    console.log('Appended to cartController.js');
}

// 2. Add route to cartRoutes.js
let routes = fs.readFileSync('routes/cartRoutes.js', 'utf8');
if (!routes.includes('adminClearCart')) {
    routes = routes.replace(
        /module\.exports = router;/,
        "router.delete('/admin/:cartId/clear', protect, authorize('admin'), cartController.adminClearCart);\n\nmodule.exports = router;"
    );
    fs.writeFileSync('routes/cartRoutes.js', routes);
    console.log('Added route to cartRoutes.js');
}
