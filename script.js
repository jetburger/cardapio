document.addEventListener('DOMContentLoaded', () => {
    const seuNumeroDeWhatsApp = '5547992853827'; // COLOQUE SEU NÚMERO AQUI
    const valorMinimoPedido = 25.00;

    let cart = [];
    let itemToRemoveId = null;

    // Referências aos elementos do DOM
    const cartSummary = document.getElementById('cart-summary');
    const totalElement = document.getElementById('total');
    const checkoutForm = document.getElementById('checkout-form');
    const cartFooter = document.querySelector('.cart-footer');
    const footerCartTotal = document.getElementById('footer-cart-total');
    const viewCartBtn = document.getElementById('view-cart-btn');
    const minOrderWarning = document.getElementById('min-order-warning');
    const submitButton = document.querySelector('button[type="submit"]');
    const burgerRequiredWarning = document.getElementById('burger-required-warning');
    const confirmationDialogOverlay = document.getElementById('confirmation-dialog-overlay');
    const confirmRemoveBtn = document.getElementById('confirm-remove-btn');
    const cancelRemoveBtn = document.getElementById('cancel-remove-btn');
    const dialogMessage = document.getElementById('dialog-message');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');
    const menuCategories = document.querySelectorAll('.menu-category');

    // --- LÓGICA DOS FILTROS (SCROLL) ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            const categoryElement = document.getElementById(`category-${filter}`);

            if (categoryElement) {
                categoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            }
        });
    });

    function renderCart() {
        cartSummary.innerHTML = '';
        if (cart.length === 0) {
            cartSummary.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalElement.textContent = 'R$ 0,00';
            cartFooter.classList.remove('visible');
            validateOrder();
            return;
        }
        let total = 0;
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            let addonsText = item.addons.length > 0 ? item.addons.map(addon => `<span class="cart-addon-item">+ ${addon.name}</span>`).join('') : '';

            itemElement.innerHTML = `
                <img src="${item.imageSrc}" alt="${item.baseName}" class="cart-item-image">
                <div class="cart-item-details">
                    <p class="cart-item-name"><strong>${item.baseName}</strong></p>
                    <div class="cart-item-addons">${addonsText}</div>
                    <div class="observation-section">
                        <a href="#" class="add-observation-link" data-item-id="${item.id}">Adicionar observação</a>
                        <textarea class="observation-text" data-item-id="${item.id}" placeholder="Ex: sem cebola...">${item.observation}</textarea>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity-control">
                        <button class="cart-btn-minus" data-item-id="${item.id}">-</button>
                        <span class="cart-quantity">${item.quantity}</span>
                        <button class="cart-btn-plus" data-item-id="${item.id}">+</button>
                    </div>
                    <button class="trash-btn" data-item-id="${item.id}">🗑️</button>
                </div>
            `;
            cartSummary.appendChild(itemElement);
            total += item.unitPrice * item.quantity;
        });
        const totalFormatted = `R$ ${total.toFixed(2).replace('.', ',')}`;
        totalElement.textContent = totalFormatted;
        footerCartTotal.textContent = totalFormatted;
        cartFooter.classList.add('visible');

        validateOrder();
        addCartButtonListeners();
    }

    function validateOrder() {
        const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const hasBurger = cart.some(item => item.type === 'burger');
        const missingAmount = valorMinimoPedido - total;
        let isOrderValid = true;
        minOrderWarning.style.display = 'none';
        if (burgerRequiredWarning) burgerRequiredWarning.style.display = 'none';
        if (total > 0 && total < valorMinimoPedido) {
            minOrderWarning.textContent = `Faltam R$ ${missingAmount.toFixed(2).replace('.', ',')} para o pedido mínimo de R$ ${valorMinimoPedido.toFixed(2).replace('.', ',')}.`;
            minOrderWarning.style.display = 'block';
            isOrderValid = false;
        }
        if (cart.length > 0 && !hasBurger) {
            if (burgerRequiredWarning) {
                burgerRequiredWarning.textContent = 'É necessário adicionar pelo menos um hambúrguer ao seu pedido.';
                burgerRequiredWarning.style.display = 'block';
            }
            isOrderValid = false;
        }
        submitButton.disabled = !isOrderValid || cart.length === 0;
    }

    function handleAddToCart(event) {
        const button = event.target;
        const menuItem = button.closest('.menu-item');
        const itemType = menuItem.dataset.type;
        const baseName = menuItem.dataset.name;
        const basePrice = parseFloat(menuItem.dataset.price);
        const imageSrc = menuItem.querySelector('.item-image').getAttribute('src');
        const quantity = parseInt(menuItem.querySelector('.quantity').textContent);

        let addons = [];
        const addonCheckboxes = menuItem.querySelectorAll('.addon-item input[type="checkbox"]:checked');
        addonCheckboxes.forEach(checkbox => {
            addons.push({ name: checkbox.dataset.addonName, price: parseFloat(checkbox.dataset.addonPrice) });
        });

        const addonsId = addons.map(a => a.name).sort().join(',');
        const itemId = `${baseName}-${addonsId}`;
        const existingItem = cart.find(item => item.id === itemId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            let unitPrice = basePrice;
            addons.forEach(addon => unitPrice += addon.price);
            cart.push({ id: itemId, baseName, addons, unitPrice, quantity, type: itemType, imageSrc, observation: '' });
        }

        menuItem.querySelector('.quantity').textContent = '1';
        addonCheckboxes.forEach(checkbox => checkbox.checked = false);

        renderCart();
    }

    function showConfirmationDialog(itemId) {
        itemToRemoveId = itemId;
        dialogMessage.textContent = "Deseja remover este item do carrinho?";
        confirmationDialogOverlay.classList.add('visible');
    }
    function hideConfirmationDialog() {
        itemToRemoveId = null;
        confirmationDialogOverlay.classList.remove('visible');
    }

    // --- CORREÇÃO FINAL APLICADA AQUI ---
    function addCartButtonListeners() {
        // Seleciona todos os botões e links DENTRO do carrinho atualizado
        const plusButtons = cartSummary.querySelectorAll('.cart-btn-plus');
        const minusButtons = cartSummary.querySelectorAll('.cart-btn-minus');
        const trashButtons = cartSummary.querySelectorAll('.trash-btn');
        const observationLinks = cartSummary.querySelectorAll('.add-observation-link');
        const observationTextareas = cartSummary.querySelectorAll('.observation-text');

        plusButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                const itemInCart = cart.find(item => item.id === itemId);
                if (itemInCart) { itemInCart.quantity++; renderCart(); }
            });
        });

        minusButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                const itemInCart = cart.find(item => item.id === itemId);
                if (itemInCart) {
                    if (itemInCart.quantity > 1) {
                        itemInCart.quantity--;
                        renderCart();
                    } else {
                        showConfirmationDialog(itemId);
                    }
                }
            });
        });

        trashButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Pega o ID do botão clicado, mesmo que o clique seja no emoji dentro dele
                const itemId = e.target.closest('[data-item-id]').dataset.itemId;
                showConfirmationDialog(itemId);
            });
        });

        observationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const textarea = link.nextElementSibling;
                textarea.classList.toggle('visible');
                if (textarea.classList.contains('visible')) textarea.focus();
            });
        });

        observationTextareas.forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const itemId = e.target.dataset.itemId;
                const itemInCart = cart.find(item => item.id === itemId);
                if (itemInCart) {
                    itemInCart.observation = e.target.value;
                }
            });
        });
    }

    checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        if (!name || !address) { alert('Por favor, preencha seu nome e endereço.'); return; }
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');
        const orderNumber = `${pad(now.getDate())}${pad(now.getMonth() + 1)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        let orderMessage = `--- NOVO PEDIDO #${orderNumber} ---\n      *JetBurger*\n\n*CLIENTE:*\n- Nome: ${name}\n- Endereço: ${address}\n\n--------------------\n\n*PEDIDO:*\n`;
        cart.forEach(item => {
            orderMessage += `- *${item.quantity}x ${item.baseName}*\n`;
            if (item.addons.length > 0) {
                item.addons.forEach(addon => { orderMessage += `  + _Adicional: ${addon.name}_\n`; });
            }
            if (item.observation) {
                orderMessage += `  _Obs: ${item.observation}_\n`;
            }
        });
        const total = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const totalValue = `R$ ${total.toFixed(2).replace('.', ',')}`;
        orderMessage += `\n--------------------\n\n*TOTAL:* ${totalValue}\n*PAGAMENTO:* Na entrega`;
        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappURL = `https://wa.me/${seuNumeroDeWhatsApp}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    });

    cancelRemoveBtn.addEventListener('click', hideConfirmationDialog);
    confirmRemoveBtn.addEventListener('click', () => {
        if (itemToRemoveId) {
            cart = cart.filter(item => item.id !== itemToRemoveId);
            renderCart();
        }
        hideConfirmationDialog();
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => { button.addEventListener('click', handleAddToCart); });
    document.querySelectorAll('.quantity-control-menu .btn-plus').forEach(button => {
        button.addEventListener('click', (e) => {
            const quantitySpan = e.target.previousElementSibling;
            let quantity = parseInt(quantitySpan.textContent);
            quantity++;
            quantitySpan.textContent = quantity;
        });
    });
    document.querySelectorAll('.quantity-control-menu .btn-minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const quantitySpan = e.target.nextElementSibling;
            let quantity = parseInt(quantitySpan.textContent);
            if(quantity > 1) {
                quantity--;
                quantitySpan.textContent = quantity;
            }
        });
    });

    viewCartBtn.addEventListener('click', () => { document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' }); });

    renderCart();
});