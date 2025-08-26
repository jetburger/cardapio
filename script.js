document.addEventListener('DOMContentLoaded', () => {
    const seuNumeroDeWhatsApp = '5511999998888'; // COLOQUE SEU NÚMERO AQUI
    const valorMinimoPedido = 25.00;

    let cart = [];

    const cartSummary = document.getElementById('cart-summary');
    const totalElement = document.getElementById('total');
    const checkoutForm = document.getElementById('checkout-form');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartFooter = document.querySelector('.cart-footer');
    const footerCartTotal = document.getElementById('footer-cart-total');
    const viewCartBtn = document.getElementById('view-cart-btn');
    const minOrderWarning = document.getElementById('min-order-warning');
    const submitButton = document.querySelector('button[type="submit"]');

    function renderCart() {
        cartSummary.innerHTML = '';
        if (cart.length === 0) {
            cartSummary.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalElement.textContent = 'R$ 0,00';
            cartFooter.classList.remove('visible');
            validateMinOrder(0);
            return;
        }
        let total = 0;
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            let addonsText = '';
            if (item.addons.length > 0) {
                addonsText = item.addons.map(addon => `&nbsp;&nbsp;+ ${addon.name}`).join('<br>');
            }
            itemElement.innerHTML = `
                <div class="cart-item-details">
                    <p class="cart-item-name"><strong>${item.baseName}</strong></p>
                    <div class="cart-item-addons">${addonsText}</div>
                </div>
                <div class="cart-item-price">R$ ${item.totalPrice.toFixed(2).replace('.', ',')}</div>
                <button class="remove-from-cart-btn" data-item-id="${item.id}">×</button>
            `;
            cartSummary.appendChild(itemElement);
            total += item.totalPrice;
        });
        const totalFormatted = `R$ ${total.toFixed(2).replace('.', ',')}`;
        totalElement.textContent = totalFormatted;
        footerCartTotal.textContent = totalFormatted;
        cartFooter.classList.add('visible');
        validateMinOrder(total);
        addRemoveButtonListeners();
    }

    function validateMinOrder(total) {
        const missingAmount = valorMinimoPedido - total;
        if (total > 0 && total < valorMinimoPedido) {
            minOrderWarning.textContent = `Faltam R$ ${missingAmount.toFixed(2).replace('.', ',')} para atingir o pedido mínimo de R$ ${valorMinimoPedido.toFixed(2).replace('.', ',')}.`;
            minOrderWarning.style.display = 'block';
            submitButton.disabled = true;
        } else {
            minOrderWarning.style.display = 'none';
            submitButton.disabled = false;
        }
        if (total === 0) {
            submitButton.disabled = true;
        }
    }

    function handleAddToCart(event) {
        const button = event.target;
        const menuItem = button.closest('.menu-item');
        const baseName = menuItem.dataset.name;
        const basePrice = parseFloat(menuItem.dataset.price);
        const newItem = { id: Date.now(), baseName: baseName, totalPrice: basePrice, addons: [] };
        const addonCheckboxes = menuItem.querySelectorAll('.addon-item input[type="checkbox"]:checked');
        addonCheckboxes.forEach(checkbox => {
            const addonName = checkbox.dataset.addonName;
            const addonPrice = parseFloat(checkbox.dataset.addonPrice);
            newItem.addons.push({ name: addonName, price: addonPrice });
            newItem.totalPrice += addonPrice;
        });
        cart.push(newItem);
        renderCart();
        addonCheckboxes.forEach(checkbox => checkbox.checked = false);
    }

    function handleRemoveFromCart(event) {
        const itemIdToRemove = parseInt(event.target.dataset.itemId);
        cart = cart.filter(item => item.id !== itemIdToRemove);
        renderCart();
    }

    function addRemoveButtonListeners() {
        const removeButtons = document.querySelectorAll('.remove-from-cart-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', handleRemoveFromCart);
        });
    }

    checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (cart.length === 0) { alert('Seu carrinho está vazio!'); return; }
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        if (!name || !address) { alert('Por favor, preencha seu nome e endereço.'); return; }

        // --- NOVIDADE: GERANDO O NÚMERO DO PEDIDO ---
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');
        const orderNumber = `${pad(now.getDate())}${pad(now.getMonth() + 1)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        // --- FIM DA NOVIDADE ---

        let orderMessage = `--- NOVO PEDIDO #${orderNumber} ---\n`; // <-- NOVIDADE AQUI
        orderMessage += `      *3D Burger*\n\n`;
        orderMessage += `*CLIENTE:*\n`;
        orderMessage += `- Nome: ${name}\n`;
        orderMessage += `- Endereço: ${address}\n\n`;
        orderMessage += `--------------------\n\n`;
        orderMessage += `*PEDIDO:*\n`;

        cart.forEach(item => {
            orderMessage += `- *${item.baseName}*\n`;
            if (item.addons.length > 0) {
                item.addons.forEach(addon => { orderMessage += `  + _Adicional: ${addon.name}_\n`; });
            }
        });

        const totalValue = document.getElementById('total').textContent;
        orderMessage += `\n--------------------\n\n`;
        orderMessage += `*TOTAL:* ${totalValue}\n`;
        orderMessage += `*PAGAMENTO:* Na entrega`;

        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappURL = `https://wa.me/${seuNumeroDeWhatsApp}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    });

    addToCartButtons.forEach(button => { button.addEventListener('click', handleAddToCart); });
    viewCartBtn.addEventListener('click', () => { document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' }); });

    renderCart();
});