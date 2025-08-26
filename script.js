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

    // --- NOVIDADE: Referência para o novo aviso ---
    const burgerRequiredWarning = document.getElementById('burger-required-warning');

    function renderCart() {
        cartSummary.innerHTML = '';
        if (cart.length === 0) {
            cartSummary.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalElement.textContent = 'R$ 0,00';
            cartFooter.classList.remove('visible');
            validateOrder(); // --- ATUALIZADO: Chama a nova função de validação geral ---
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

        validateOrder(); // --- ATUALIZADO: Chama a nova função de validação geral ---
        addRemoveButtonListeners();
    }

    // --- NOVIDADE: Uma função de validação que verifica TUDO ---
    function validateOrder() {
        const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
        const hasBurger = cart.some(item => item.type === 'burger');
        const missingAmount = valorMinimoPedido - total;
        let isOrderValid = true;

        // Esconde os avisos por padrão
        minOrderWarning.style.display = 'none';
        burgerRequiredWarning.style.display = 'none';

        // Validação 1: Pedido mínimo
        if (total > 0 && total < valorMinimoPedido) {
            minOrderWarning.textContent = `Faltam R$ ${missingAmount.toFixed(2).replace('.', ',')} para o pedido mínimo de R$ ${valorMinimoPedido.toFixed(2).replace('.', ',')}.`;
            minOrderWarning.style.display = 'block';
            isOrderValid = false;
        }

        // Validação 2: Presença de um hambúrguer
        if (cart.length > 0 && !hasBurger) {
            burgerRequiredWarning.textContent = 'É necessário adicionar pelo menos um hambúrguer ao seu pedido.';
            burgerRequiredWarning.style.display = 'block';
            isOrderValid = false;
        }

        // Habilita ou desabilita o botão com base na validade geral
        submitButton.disabled = !isOrderValid || cart.length === 0;
    }

    function handleAddToCart(event) {
        const button = event.target;
        const menuItem = button.closest('.menu-item');

        // --- NOVIDADE: Captura o 'type' do item ---
        const itemType = menuItem.dataset.type;
        const baseName = menuItem.dataset.name;
        const basePrice = parseFloat(menuItem.dataset.price);

        const newItem = {
            id: Date.now(),
            baseName: baseName,
            totalPrice: basePrice,
            addons: [],
            type: itemType // Armazena o tipo no objeto do carrinho
        };

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
        // A validação já desabilita o botão, então um clique aqui significa que o pedido é válido.
        // O código restante permanece o mesmo...
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        if (!name || !address) { alert('Por favor, preencha seu nome e endereço.'); return; }
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');
        const orderNumber = `${pad(now.getDate())}${pad(now.getMonth() + 1)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        let orderMessage = `--- NOVO PEDIDO #${orderNumber} ---\n      *JetBurger*\n\n*CLIENTE:*\n- Nome: ${name}\n- Endereço: ${address}\n\n--------------------\n\n*PEDIDO:*\n`;
        cart.forEach(item => {
            orderMessage += `- *${item.baseName}*\n`;
            if (item.addons.length > 0) {
                item.addons.forEach(addon => { orderMessage += `  + _Adicional: ${item.baseName}_\n`; });
            }
        });
        const totalValue = document.getElementById('total').textContent;
        orderMessage += `\n--------------------\n\n*TOTAL:* ${totalValue}\n*PAGAMENTO:* Na entrega`;
        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappURL = `https://wa.me/${seuNumeroDeWhatsApp}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    });

    addToCartButtons.forEach(button => { button.addEventListener('click', handleAddToCart); });
    viewCartBtn.addEventListener('click', () => { document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' }); });

    // Inicia a renderização e validação
    renderCart();
});