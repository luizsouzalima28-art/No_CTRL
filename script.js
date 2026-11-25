// DADOS DOS PRODUTOS COM SUPORTE A DESCONTO, TAMANHOS E CORES VARIÁVEIS
let PRODUCTS = JSON.parse(localStorage.getItem('no_control_products')) || [
  { id: 1, name: "Hoodie Heavyweight Black", cat: "hoodie", price: 349.90, discount: 0, badge: "BEST SELLER", img: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500", sizes: ["P", "M", "G", "GG"], colors: ["Preto", "Cinza Chumbo", "Verde Militar"] },
  { id: 2, name: "Camiseta Wildstyle Oversized", cat: "tee", price: 159.90, discount: 10, badge: "LIMITED DROP", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500", sizes: ["P", "M", "G"], colors: ["Branco Off", "Preto Washed"] },
  { id: 3, name: "Calça Cargo Utility Vandal", cat: "pants", price: 289.90, discount: 0, badge: "NOVO", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500", sizes: ["38", "40", "42", "44"], colors: ["Preto Tático", "Bege Areia"] },
  { id: 4, name: "Tênis Vandal Chunky", cat: "shoes", price: 499.90, discount: 15, badge: "LIMITED DROP", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", sizes: ["39", "40", "41", "42", "43"], colors: ["Vermelho Impacto", "All Black", "Branco/Grafite"] }
];

let cart = [];
let isAdmin = false;
let currentFilter = 'all';

// CANVAS & CANETÃO/POSCA SETUP
const canvas = document.getElementById('sprayCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;
let audioCtx = null;
let lastX = 0;
let lastY = 0;

function resizeCanvas() {
  if (canvas && canvas.parentElement) {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 380;
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function playSpraySound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 0.05;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  } catch (e) {}
}

if (canvas) {
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
    drawFineLine(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) drawFineLine(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('mouseup', () => isDrawing = false);
  canvas.addEventListener('mouseleave', () => isDrawing = false);
}

function drawFineLine(x, y) {
  const color = document.getElementById('sprayColor').value;
  const size = parseInt(document.getElementById('spraySize').value);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x;
  lastY = y;
  playSpraySound();
}

const btnClear = document.getElementById('btnClearCanvas');
if (btnClear) {
  btnClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

const btnStencil = document.getElementById('btnAutoStencil');
if (btnStencil) {
  btnStencil.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '70px "Permanent Marker"';
    ctx.fillStyle = '#ff0055';
    ctx.textAlign = 'center';
    ctx.fillText('NO CONTROL', canvas.width / 2, canvas.height / 2 + 20);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeText('NO CONTROL', canvas.width / 2, canvas.height / 2 + 20);
  });
}

// LOGIN & VALIDAÇÃO DO ADMIN
document.getElementById('btnEnterShop').addEventListener('click', () => {
  const tag = document.getElementById('usernameInput').value.trim() || 'Vandal';
  const email = document.getElementById('emailInput').value.trim();
  const pass = document.getElementById('passwordInput').value.trim();

  if (!email || !pass) {
    alert('Por favor, preencha o E-mail e a Senha para entrar.');
    return;
  }

  if (email === "joao.proni.pereira@escola.pr.gov.br" && pass === "25052010j") {
    isAdmin = true;
    alert('Credenciais de Administrador confirmadas com sucesso!');
  } else {
    isAdmin = false;
  }
  entrarNaLoja(tag);
});

function entrarNaLoja(vulgo) {
  document.getElementById('userTag').innerText = `@${vulgo}`;
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('shop').classList.remove('hidden');
  if (isAdmin) {
    document.getElementById('btnOpenAdmin').classList.remove('hidden');
  } else {
    document.getElementById('btnOpenAdmin').classList.add('hidden');
  }
  renderProducts('all');
}

// LEITOR DE QR CODE COM CÂMERA
let html5QrcodeScanner = null;
let cameraActive = false;
const btnToggleCamera = document.getElementById('btnToggleCamera');

if (btnToggleCamera) {
  btnToggleCamera.addEventListener('click', () => {
    const qrReaderDiv = document.getElementById('qr-reader');
    if (!cameraActive) {
      qrReaderDiv.classList.remove('hidden');
      btnToggleCamera.innerText = 'Desativar Câmera';
      cameraActive = true;
      html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );
      html5QrcodeScanner.render((decodedText) => {
        document.getElementById('qrResult').innerText = `QR Code Lido: ${decodedText}`;
        html5QrcodeScanner.clear();
        qrReaderDiv.classList.add('hidden');
        btnToggleCamera.innerText = 'Ativar Câmera';
        cameraActive = false;
        setTimeout(() => { entrarNaLoja(decodedText); }, 1000);
      });
    } else {
      if (html5QrcodeScanner) html5QrcodeScanner.clear();
      qrReaderDiv.classList.add('hidden');
      btnToggleCamera.innerText = 'Ativar Câmera';
      cameraActive = false;
    }
  });
}

// RENDERIZAR PRODUTOS NA LOJA
function renderProducts(filter = 'all') {
  currentFilter = filter;
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ddd;">Nenhuma peça encontrada nessa categoria.</p>`;
    return;
  }

  filtered.forEach(p => {
    const hasDiscount = p.discount && p.discount > 0;
    const finalPrice = hasDiscount ? p.price * (1 - p.discount / 100) : p.price;
    const defaultSize = p.sizes && p.sizes.length > 0 ? p.sizes[0] : 'Único';
    const defaultColor = p.colors && p.colors.length > 0 ? p.colors[0] : 'Única';

    let sizesHtml = `<div class="variant-group"><span class="variant-label">Tamanho:</span><div class="size-selector" id="sizes-${p.id}">`;
    if (p.sizes && p.sizes.length > 0) {
      p.sizes.forEach((s, idx) => {
        sizesHtml += `<button class="size-btn ${idx === 0 ? 'active' : ''}" onclick="selectSize(${p.id}, '${s}', this)">${s}</button>`;
      });
    }
    sizesHtml += `</div></div>`;

    let colorsHtml = `<div class="variant-group"><span class="variant-label">Cor:</span><div class="color-selector" id="colors-${p.id}">`;
    if (p.colors && p.colors.length > 0) {
      p.colors.forEach((c, idx) => {
        colorsHtml += `<button class="color-btn ${idx === 0 ? 'active' : ''}" onclick="selectColor(${p.id}, '${c}', this)">${c}</button>`;
      });
    }
    colorsHtml += `</div></div>`;

    grid.innerHTML += `
      <div class="product-card" data-selected-size="${defaultSize}" data-selected-color="${defaultColor}">
        <img src="${p.img}" class="product-img" alt="${p.name}">
        <div class="product-info">
          <div>
            <span class="badge">${p.badge}</span>
            ${hasDiscount ? `<span class="badge badge-discount">-${p.discount}% OFF</span>` : ''}
            <h4>${p.name}</h4>
            ${colorsHtml}
            ${sizesHtml}
          </div>
          <div class="price-box">
            ${hasDiscount ? `<span class="old-price">R$ ${p.price.toFixed(2)}</span>` : ''}
            <span class="price">R$ ${finalPrice.toFixed(2)}</span>
          </div>
          <button class="btn-primary full-width" onclick="addToCart(${p.id})">ADICIONAR</button>
        </div>
      </div>
    `;
  });
}

window.selectSize = function(productId, size, btnElement) {
  const container = document.getElementById(`sizes-${productId}`);
  container.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  btnElement.closest('.product-card').dataset.selectedSize = size;
};

window.selectColor = function(productId, color, btnElement) {
  const container = document.getElementById(`colors-${productId}`);
  container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  btnElement.closest('.product-card').dataset.selectedColor = color;
};

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderProducts(e.target.dataset.cat);
  });
});

// PAINEL ADMINISTRATIVO
document.getElementById('btnOpenAdmin').addEventListener('click', () => {
  document.getElementById('shop').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  renderAdminProducts();
});

document.getElementById('btnCloseAdmin').addEventListener('click', () => {
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('shop').classList.remove('hidden');
  renderProducts(currentFilter);
});

document.getElementById('btnAddProduct').addEventListener('click', () => {
  const name = document.getElementById('newProdName').value.trim();
  const cat = document.getElementById('newProdCat').value;
  const price = parseFloat(document.getElementById('newProdPrice').value);
  const badge = document.getElementById('newProdBadge').value.trim() || 'NOVO';
  const discount = parseFloat(document.getElementById('newProdDiscount').value) || 0;
  const sizesInput = document.getElementById('newProdSizes').value;
  const colorsInput = document.getElementById('newProdColors').value;
  const fileInput = document.getElementById('newProdFile');

  if (!name || isNaN(price)) {
    alert('Preencha ao menos o Nome e o Preço do produto!');
    return;
  }

  const sizesArray = sizesInput ? sizesInput.split(',').map(s => s.trim()).filter(s => s !== '') : ["P", "M", "G"];
  const colorsArray = colorsInput ? colorsInput.split(',').map(c => c.trim()).filter(c => c !== '') : ["Preto"];
  const newId = Date.now();
  let imgUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500";

  const saveAndPush = (imageSrc) => {
    PRODUCTS.push({ id: newId, name, cat, price, discount, badge, img: imageSrc, sizes: sizesArray, colors: colorsArray });
    localStorage.setItem('no_control_products', JSON.stringify(PRODUCTS));
    alert('Nova peça cadastrada com sucesso!');
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdBadge').value = '';
    document.getElementById('newProdDiscount').value = '0';
    document.getElementById('newProdSizes').value = 'P, M, G, GG';
    document.getElementById('newProdColors').value = 'Preto, Branco';
    document.getElementById('newProdFile').value = '';
    renderAdminProducts();
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { saveAndPush(e.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    saveAndPush(imgUrl);
  }
});

function renderAdminProducts() {
  const list = document.getElementById('adminProductList');
  list.innerHTML = '';
  PRODUCTS.forEach((p, index) => {
    list.innerHTML += `
      <div style="background: #151515; padding: 15px; border-radius: 6px; border: 1px solid #333; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <img id="admin-preview-${index}" src="${p.img}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #444;">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 240px;">
          <label style="font-size: 0.75rem; color: #888;">Nome do Produto:</label>
          <input type="text" id="admin-name-${index}" value="${p.name}" style="background: #000; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px;">
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; color: #888;">Preço Base (R$):</label>
              <input type="number" step="0.01" id="admin-price-${index}" value="${p.price}" style="background: #000; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; width: 100%;">
            </div>
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; color: #888;">Desconto (%):</label>
              <input type="number" id="admin-discount-${index}" value="${p.discount || 0}" style="background: #000; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; width: 100%;">
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; color: #888;">Tamanhos (vírgula):</label>
              <input type="text" id="admin-sizes-${index}" value="${p.sizes ? p.sizes.join(', ') : 'P, M, G'}" style="background: #000; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; width: 100%;">
            </div>
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; color: #888;">Cores (vírgula):</label>
              <input type="text" id="admin-colors-${index}" value="${p.colors ? p.colors.join(', ') : 'Preto'}" style="background: #000; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; width: 100%;">
            </div>
          </div>
          <label style="font-size: 0.75rem; color: #888;">Categoria:</label>
          <select id="admin-cat-${index}" style="background: #000; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px;">
            <option value="tee" ${p.cat === 'tee' ? 'selected' : ''}>Camiseta</option>
            <option value="hoodie" ${p.cat === 'hoodie' ? 'selected' : ''}>Hoodie / Moletom</option>
            <option value="pants" ${p.cat === 'pants' ? 'selected' : ''}>Calça</option>
            <option value="shoes" ${p.cat === 'shoes' ? 'selected' : ''}>Calçado</option>
          </select>
          <label style="font-size: 0.75rem; color: #888;">Trocar Imagem:</label>
          <input type="file" id="admin-file-${index}" accept="image/*" onchange="previewLocalImage(event, ${index})" style="background: #000; border: 1px solid #444; color: #fff; padding: 4px; border-radius: 4px; font-size: 0.8rem;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button onclick="saveProductData(${index})" class="btn-primary">Salvar Alterações</button>
          <button onclick="deleteProduct(${index})" style="background: #ff0055; color: #fff; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Excluir Peça</button>
        </div>
      </div>
    `;
  });
}

window.previewLocalImage = function(event, index) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      PRODUCTS[index].img = e.target.result;
      document.getElementById(`admin-preview-${index}`).src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

window.saveProductData = function(index) {
  const newName = document.getElementById(`admin-name-${index}`).value;
  const newPrice = parseFloat(document.getElementById(`admin-price-${index}`).value);
  const newDiscount = parseFloat(document.getElementById(`admin-discount-${index}`).value) || 0;
  const newCat = document.getElementById(`admin-cat-${index}`).value;
  const newSizesStr = document.getElementById(`admin-sizes-${index}`).value;
  const newColorsStr = document.getElementById(`admin-colors-${index}`).value;

  PRODUCTS[index].name = newName;
  PRODUCTS[index].price = isNaN(newPrice) ? PRODUCTS[index].price : newPrice;
  PRODUCTS[index].discount = newDiscount;
  PRODUCTS[index].cat = newCat;
  PRODUCTS[index].sizes = newSizesStr.split(',').map(s => s.trim()).filter(s => s !== '');
  PRODUCTS[index].colors = newColorsStr.split(',').map(c => c.trim()).filter(c => c !== '');

  localStorage.setItem('no_control_products', JSON.stringify(PRODUCTS));
  alert('Peça atualizada com sucesso!');
  renderAdminProducts();
};

window.deleteProduct = function(index) {
  if (confirm('Tem certeza que deseja remover esta peça?')) {
    PRODUCTS.splice(index, 1);
    localStorage.setItem('no_control_products', JSON.stringify(PRODUCTS));
    renderAdminProducts();
  }
};

// CARRINHO
window.addToCart = function(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (prod) {
    const card = event.target.closest('.product-card');
    const selectedSize = card ? card.dataset.selectedSize : (prod.sizes ? prod.sizes[0] : 'Único');
    const selectedColor = card ? card.dataset.selectedColor : (prod.colors ? prod.colors[0] : 'Única');
    const cartItem = { ...prod, cartId: Date.now() + Math.random(), selectedSize: selectedSize, selectedColor: selectedColor };
    cart.push(cartItem);
    updateCart();
    openCart();
  }
};

function updateCart() {
  document.getElementById('cartCount').innerText = cart.length;
  const cartItems = document.getElementById('cartItems');
  cartItems.innerHTML = '';
  let subtotal = 0;
  let totalDiscounts = 0;

  cart.forEach((item, idx) => {
    const hasDiscount = item.discount && item.discount > 0;
    const itemFinalPrice = hasDiscount ? item.price * (1 - item.discount / 100) : item.price;
    const itemDiscountVal = item.price - itemFinalPrice;
    subtotal += item.price;
    totalDiscounts += itemDiscountVal;

    cartItems.innerHTML += `
      <div class="cart-item">
        <img src="${item.img}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-details">
          <strong>${item.name}</strong><br>
          <small style="color: #00f0ff;">Cor: ${item.selectedColor} | Tam: ${item.selectedSize}</small><br>
          <small style="color:#888;">
            ${hasDiscount ? `<span style="text-decoration: line-through;">R$ ${item.price.toFixed(2)}</span> ` : ''}
            <span>R$ ${itemFinalPrice.toFixed(2)}</span>
          </small>
        </div>
        <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff0055; cursor:pointer; font-weight:bold;">Remover</button>
      </div>
    `;
  });

  const pixDiscount = (subtotal - totalDiscounts) * 0.05;
  const grandTotalDiscount = totalDiscounts + pixDiscount;
  const total = subtotal - grandTotalDiscount;

  document.getElementById('subtotalVal').innerText = `R$ ${subtotal.toFixed(2)}`;
  document.getElementById('discountVal').innerText = `- R$ ${grandTotalDiscount.toFixed(2)}`;
  document.getElementById('totalVal').innerText = `R$ ${total.toFixed(2)}`;
}

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCart();
};

function openCart() {
  document.getElementById('cartDrawer').classList.remove('hidden');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.add('hidden');
}

document.getElementById('btnOpenCart').addEventListener('click', openCart);
document.getElementById('btnCloseCart').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

// CHECKOUT PIX MODAL
document.getElementById('btnCheckout').addEventListener('click', () => {
  if (cart.length === 0) return alert('Seu carrinho está vazio!');
  closeCart();
  document.getElementById('pixModal').classList.remove('hidden');
});

document.getElementById('btnClosePix').addEventListener('click', () => {
  document.getElementById('pixModal').classList.add('hidden');
});

document.getElementById('btnCopyPix').addEventListener('click', () => {
  const input = document.getElementById('pixKeyInput');
  input.select();
  navigator.clipboard.writeText(input.value);
  document.getElementById('copyStatus').innerText = 'Chave PIX copiada com sucesso!';
});

// NAVEGAÇÃO DOS ÍCONES DA BARRA LATERAL E QR WIDGET
const btnSideCart = document.getElementById('btnSideCart');
if (btnSideCart) btnSideCart.addEventListener('click', openCart);

const btnVoltarMuro = document.getElementById('btnVoltarMuro');
if (btnVoltarMuro) {
  btnVoltarMuro.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('shop').classList.add('hidden');
    document.getElementById('lobby').classList.remove('hidden');
  });
}

const btnQuickScanner = document.getElementById('btnQuickScanner');
if (btnQuickScanner) {
  btnQuickScanner.addEventListener('click', () => {
    document.getElementById('shop').classList.add('hidden');
    document.getElementById('lobby').classList.remove('hidden');
    document.getElementById('btnToggleCamera').click();
  });
}