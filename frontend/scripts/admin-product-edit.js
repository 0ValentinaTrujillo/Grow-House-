// ================================================================
// PRODUCT-EDITOR.JS - GESTOR DE EDICIÓN (MODAL)
// ================================================================

let currentEditingId = null;

/**
 * 📝 Abre el modal y carga los datos del producto
 */
window.editProductFromCard = async function(productId) {
    try {
        // Usamos nuestra API centralizada
        const response = await api.getProduct(productId);
        const product = response.data; // Ajustado según estructura típica de tu API

        currentEditingId = productId;
        
        // Llenado del formulario
        document.getElementById('productId').value = product.id || product._id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productBrand').value = product.brand || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productOriginalPrice').value = product.originalPrice || '';
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productLowStockAlert').value = product.lowStockAlert || 5;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productMainImage').value = product.mainImage;
        document.getElementById('productStatus').value = product.status;
        document.getElementById('productFeatured').checked = product.featured;
        document.getElementById('productTags').value = (product.tags || []).join(', ');

        // Mostrar modal
        document.getElementById('productModal').classList.remove('hidden');

    } catch (error) {
        console.error('❌ Error cargando producto:', error);
        alert('No se pudo cargar la información del producto');
    }
};

/**
 * ❌ Cierra el modal
 */
window.closeModal = function() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('hidden');
    currentEditingId = null;
};

/**
 * 💾 Guardar Cambios
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('productForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentEditingId) return;

        // Recolectar datos
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            brand: document.getElementById('productBrand').value || null,
            price: parseFloat(document.getElementById('productPrice').value),
            originalPrice: document.getElementById('productOriginalPrice').value ? parseFloat(document.getElementById('productOriginalPrice').value) : null,
            quantity: parseInt(document.getElementById('productQuantity').value),
            lowStockAlert: parseInt(document.getElementById('productLowStockAlert').value),
            description: document.getElementById('productDescription').value,
            mainImage: document.getElementById('productMainImage').value,
            status: document.getElementById('productStatus').value,
            featured: document.getElementById('productFeatured').checked,
            tags: document.getElementById('productTags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        try {
            // Usamos nuestra API centralizada (ya incluye el Token)
            const res = await api.updateProduct(currentEditingId, productData);
            
            if (res) {
                closeModal();
                // Notificación profesional si existe el plugin, si no, alert
                if (window.showAuthNotification) {
                    showAuthNotification('Producto actualizado correctamente', 'success');
                } else {
                    alert('✅ Producto actualizado');
                }
                
                // Recargar la lista de productos si la función existe
                if (typeof cargarProductos === 'function') {
                    cargarProductos(typeof currentPage !== 'undefined' ? currentPage : 1);
                }
            }
        } catch (error) {
            console.error('❌ Error al actualizar:', error);
            alert(error.message || 'Error al guardar los cambios');
        }
    });
});