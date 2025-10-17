/* script.js
   Shared site logic (products, rendering, cart, admin)
   Stores products & cart in localStorage so state persists across pages.
*/

const STORAGE = {
  PRODUCTS: 'stride_products_v1',
  CART: 'stride_cart_v1'
};

// --- initial realistic products (only set if not present in localStorage) ---
const defaultProducts = [
  {
    id: 'p1',
    name: 'Columbia Trail Shoes',
    brand: 'Columbia',
    price: 3499,
    images: ['https://columbiasportswear.ph/cdn/shop/files/1000490548_01_2048x.jpg?v=1727060244'],
    isNew: true,
    isBestSeller: false,
    discount: 0,
    sizes: [7,8,9,10]
  },
  {
    id: 'p2',
    name: "Nike Blazer Low '77 Vintage",
    brand: 'Nike',
    price: 4299,
    images: ['https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/83aad9de-aa49-48d9-9c1e-9f89e3d87eb9/BLAZER+LOW+%2777+VNTG.png'],
    isNew: true,
    isBestSeller: true,
    discount: 0,
    sizes: [7,8,9,10,11]
  },
  {
    id: 'p3',
    name: 'Professor Oxford Leather',
    brand: 'The Jacket Maker',
    price: 4899,
    images: ['https://www.thejacketmaker.lu/cdn/shop/products/01_Professor_Oxford_Black_Leather_Shoes_Front_Tilted-2-1674261796520_60495991-804b-41f3-a1d2-407ae54c86dc_2048x.webp?v=1756909998'],
    isNew: true,
    isBestSeller: false,
    discount: 25,
    sizes: [7,8,9,10,11]
  },
  {
    id: 'p4',
    name: 'Adidas Forum Low',
    brand: 'Adidas',
    price: 3799,
    images: ['https://www.footlocker.ph/media/catalog/product/cache/f57d6f7ebc711fc328170f0ddc174b08/0/8/0803-ADIJH620800W06H-1.jpg'],
    isNew: true,
    isBestSeller: true,
    discount: 0,
    sizes: [7,8,9,10]
  }
];

function loadProducts(){
  const raw = localStorage.getItem(STORAGE.PRODUCTS);
  if(!raw){ localStorage.setItem(STORAGE.PRODUCTS, JSON.stringify(defaultProducts)); return defaultProducts; }
  try { return JSON.parse(raw); } catch(e){ return defaultProducts; }
}
function saveProducts(list){ localStorage.setItem(STORAGE.PRODUCTS, JSON.stringify(list)); }

function loadCart(){ const raw = localStorage.getItem(STORAGE.CART); return raw ? JSON.parse(raw) : []; }
function saveCart(cart){ localStorage.setItem(STORAGE.CART, JSON.stringify(cart)); updateCartCount(); }

function updateCartCount(){
  const el = document.getElementById('cart-count');
  if(el){ const cart = loadCart(); const count = cart.reduce((s,i)=>s+i.qty,0); el.textContent = count; }
}

// simple element helpers
function el(html){ const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

// render small product card used across pages
function createProductCard(p){
  const div = document.createElement('div');
  div.className = 'product-card';
  div.innerHTML = `
    <img src="${p.images[0]}" alt="${p.name}">
    ${p.discount ? `<span class="badge red">-${p.discount}%</span>` : (p.isBestSeller ? `<span class="badge blue">HOT</span>` : (p.isNew ? `<span class="badge green">NEW</span>` : ''))}
    <h4>${p.name}</h4>
    <p class="brand">${p.brand}</p>
    <p class="price">₱${p.price.toLocaleString()}</p>
    <div style="padding:0 12px 18px;">
      <a class="btn btn-light small" href="product.html?id=${p.id}">View</a>
      <button class="btn btn-outline small add-now" data-id="${p.id}" style="margin-left:8px">Add</button>
    </div>
  `;
  // add button listener
  setTimeout(()=>{ // small defer to ensure element in DOM for event binding contexts
    const btn = div.querySelector('.add-now');
    if(btn) btn.addEventListener('click', ()=>{ addToCart(p.id,1); alert('Added to cart'); });
  },0);
  return div;
}

function renderFeatured(){
  const products = loadProducts();
  const grid = document.getElementById('featured-grid');
  if(!grid) return;
  grid.innerHTML = '';
  // choose first 4
  products.slice(0,4).forEach(p=> grid.appendChild(createProductCard(p)));
}

function renderShop(){
  const products = loadProducts();
  const grid = document.getElementById('products-grid');
  const best = document.getElementById('bestsellers-grid');
  const offers = document.getElementById('offers-grid');
  if(grid){ grid.innerHTML=''; products.forEach(p=> grid.appendChild(createProductCard(p))); }
  if(best){ best.innerHTML=''; products.filter(p=>p.isBestSeller).forEach(p=> best.appendChild(createProductCard(p))); }
  if(offers){ offers.innerHTML=''; products.filter(p=>p.discount && p.discount>0).forEach(p=> best.appendChild(createProductCard(p))); // we also show in best for simplicity
    products.filter(p=>p.discount && p.discount>0).forEach(p=> offers.appendChild(createProductCard(p)));
  }
}

function getProductById(id){
  return loadProducts().find(p=>p.id===id);
}

// product detail page
function renderProductDetail(){
  const detailWrap = document.getElementById('product-detail');
  if(!detailWrap) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'p1';
  const p = getProductById(id);
  if(!p){ detailWrap.innerHTML = '<p>Product not found</p>'; return; }

  detailWrap.innerHTML = `
    <div class="product-detail-grid">
      <div>
        <div class="product-gallery">
          <img id="main-img" src="${p.images[0]}" alt="${p.name}" style="width:100%;height:420px;object-fit:cover">
        </div>
        <div class="thumb-row" id="thumb-row"></div>
      </div>
      <div>
        <div style="display:flex;gap:8px;align-items:center"><h1 style="margin:0">${p.name}</h1></div>
        <p class="brand">${p.brand}</p>
        <div style="margin:12px 0;font-size:1.6rem;font-weight:800">₱${p.price.toLocaleString()} ${p.discount ? `<span class="old-price">₱${Math.round(p.price/(1-p.discount/100)).toLocaleString()}</span>` : ''}</div>
        <p style="color:var(--muted);margin-bottom:16px">${p.description || 'High-quality footwear for everyday use.'}</p>

        <div style="margin-bottom:12px">
          <label style="display:block;margin-bottom:6px">Size</label>
          <select id="select-size" style="padding:8px;border-radius:8px;border:1px solid #e8e8e8">
            ${p.sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>

        <div style="display:flex;gap:12px;align-items:center;margin-bottom:24px">
          <input id="qty" type="number" min="1" value="1" style="width:80px;padding:8px;border-radius:8px;border:1px solid #e8e8e8">
          <button id="add-to-cart" class="btn btn-light">Add to Cart</button>
          <a href="cart.html" class="btn btn-outline">View Cart</a>
        </div>

        <div style="border-top:1px solid #f1f1f1;padding-top:12px;color:var(--muted)">
          <div style="display:flex;gap:8px;align-items:center"><span>🚚</span><span>Free shipping over ₱5,000</span></div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><span>↩️</span><span>30-day return policy</span></div>
        </div>
      </div>
    </div>
  `;

  const thumbs = document.getElementById('thumb-row');
  thumbs.innerHTML = p.images.map((src, idx)=>`<img src="${src}" class="${idx===0?'active':''}" data-src="${src}" />`).join('');
  thumbs.querySelectorAll('img').forEach(img=>{
    img.addEventListener('click', (e)=>{
      thumbs.querySelectorAll('img').forEach(i=>i.classList.remove('active'));
      img.classList.add('active');
      document.getElementById('main-img').src = img.dataset.src;
    });
  });

  document.getElementById('add-to-cart').addEventListener('click', ()=>{
    const qty = Math.max(1, parseInt(document.getElementById('qty').value||1));
    const size = document.getElementById('select-size').value;
    addToCart(p.id, qty, size);
    alert('Added to cart');
    updateCartCount();
  });
}

// cart page
function renderCartPage(){
  const wrap = document.getElementById('cart-area');
  if(!wrap) return;
  const cart = loadCart();
  if(cart.length===0){
    wrap.innerHTML = `<div class="cart-list"><p>Your cart is empty. <a href="shop.html">Shop now →</a></p></div>`;
    return;
  }
  const products = loadProducts();
  let html = `<div class="cart-list">`;
  cart.forEach((it, idx)=>{
    const p = products.find(x=>x.id===it.id);
    html += `
      <div class="cart-item">
        <div style="width:84px;height:84px;border-radius:8px;overflow:hidden"><img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover"></div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div>
              <strong>${p.name}</strong>
              <div style="color:var(--muted);font-size:.95rem">${p.brand} • Size: ${it.size||'-'}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800">₱${(p.price*it.qty).toLocaleString()}</div>
              <button class="btn btn-outline small remove-item" data-idx="${idx}" style="margin-top:8px">Remove</button>
            </div>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
            <button class="qty-btn" data-op="dec" data-idx="${idx}">−</button>
            <span>${it.qty}</span>
            <button class="qty-btn" data-op="inc" data-idx="${idx}">+</button>
          </div>
        </div>
      </div>
    `;
  });
  const subtotal = cart.reduce((s,i)=> {
    const p = products.find(x=>x.id===i.id);
    return s + (p.price * i.qty);
  },0);
  const shipping = subtotal > 5000 ? 0 : 200;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  html += `</div>
    <div style="margin-top:18px" class="summary">
      <div style="display:flex;justify-content:space-between"><span>Subtotal</span><strong>₱${subtotal.toLocaleString()}</strong></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px"><span>Shipping</span><span>${shipping===0?'FREE':'₱'+shipping.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px"><span>Tax (8%)</span><span>₱${tax.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:1.1rem"><span>Total</span><strong>₱${total.toLocaleString()}</strong></div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <a class="btn btn-light" href="checkout.html">Proceed to Checkout</a>
        <a class="btn btn-outline" href="shop.html">Continue Shopping</a>
      </div>
    </div>
  `;
  wrap.innerHTML = html;

  // attach events
  wrap.querySelectorAll('.remove-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.idx);
      removeCartItem(idx);
      renderCartPage();
    });
  });
  wrap.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = Number(btn.dataset.idx);
      const op = btn.dataset.op;
      const cart = loadCart();
      if(op==='inc') cart[idx].qty++;
      else cart[idx].qty = Math.max(1, cart[idx].qty-1);
      saveCart(cart);
      renderCartPage();
    });
  });
  updateCartCount();
}

// checkout page
function renderCheckoutPage(){
  const wrap = document.getElementById('checkout-area');
  if(!wrap) return;
  const cart = loadCart();
  if(cart.length===0){ wrap.innerHTML = `<p>Your cart is empty. <a href="shop.html">Shop now →</a></p>`; return; }
  const products = loadProducts();
  const subtotal = cart.reduce((s,i)=> s + (products.find(p=>p.id===i.id).price * i.qty),0);
  const shipping = subtotal > 5000 ? 0 : 200;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 320px;gap:20px">
      <form id="checkout-form" style="background:var(--white);padding:18px;border-radius:12px;box-shadow:var(--card-shadow)">
        <h3>Shipping Information</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <input required placeholder="Full name" style="flex:1;padding:10px;border-radius:8px;border:1px solid #e8e8e8">
          <input required placeholder="Email" style="flex:1;padding:10px;border-radius:8px;border:1px solid #e8e8e8">
          <input required placeholder="Phone" style="flex:1;padding:10px;border-radius:8px;border:1px solid #e8e8e8">
          <input required placeholder="Address" style="flex:1 1 100%;padding:10px;border-radius:8px;border:1px solid #e8e8e8">
        </div>
        <h3 style="margin-top:12px">Payment</h3>
        <select required style="padding:10px;border-radius:8px;border:1px solid #e8e8e8;width:100%;margin-bottom:12px">
          <option value="card">Credit/Debit Card</option>
          <option value="gcash">GCash</option>
          <option value="paypal">PayPal</option>
        </select>
        <button class="btn btn-light" type="submit">Place Order</button>
      </form>

      <aside class="summary">
        <h3>Order Summary</h3>
        <div style="margin-top:8px">
          <div style="display:flex;justify-content:space-between"><span>Subtotal</span><strong>₱${subtotal.toLocaleString()}</strong></div>
          <div style="display:flex;justify-content:space-between;margin-top:6px"><span>Shipping</span><span>${shipping===0?'FREE':'₱'+shipping.toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;margin-top:6px"><span>Tax</span><span>₱${tax.toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;margin-top:12px"><strong>Total</strong><strong>₱${total.toLocaleString()}</strong></div>
        </div>
      </aside>
    </div>
  `;

  document.getElementById('checkout-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    // simulate
    localStorage.removeItem(STORAGE.CART);
    alert('Order placed! Thank you (demo).');
    updateCartCount();
    location.href = 'account.html';
  });
}

// account page
function renderAccountPage(){
  const wrap = document.getElementById('account-area');
  if(!wrap) return;
  wrap.innerHTML = `
    <div style="display:flex;gap:20px;align-items:start">
      <div style="width:260px;background:var(--white);padding:18px;border-radius:12px;box-shadow:var(--card-shadow)">
        <div style="width:88px;height:88px;border-radius:999px;background:#f1f1f1;margin:0 auto 12px"></div>
        <h3 style="text-align:center">John Doe</h3>
        <p style="text-align:center;color:var(--muted)">john.doe@example.com</p>
        <div style="margin-top:12px">
          <a class="btn btn-outline" href="order-history.html">Order History</a>
        </div>
      </div>
      <div style="flex:1">
        <h3>Recent Orders (demo)</h3>
        <div style="background:var(--white);padding:12px;border-radius:12px;box-shadow:var(--card-shadow)">
          <p>No real orders in demo. Place a sample order to test checkout flow.</p>
        </div>
      </div>
    </div>
  `;
}

// admin page
function renderAdminPage(){
  const list = document.getElementById('admin-products-list');
  const form = document.getElementById('add-product-form');
  if(!list || !form) return;
  function refresh(){
    const prods = loadProducts();
    list.innerHTML = '';
    prods.forEach(p=>{
      const card = createProductCard(p);
      // attach delete button
      const del = document.createElement('button');
      del.className = 'btn btn-outline small';
      del.textContent = 'Delete';
      del.style.margin = '12px';
      del.addEventListener('click', ()=>{
        if(!confirm('Delete product?')) return;
        const remaining = loadProducts().filter(x=>x.id!==p.id);
        saveProducts(remaining);
        refresh();
      });
      const wrapper = document.createElement('div');
      wrapper.appendChild(card);
      wrapper.appendChild(del);
      list.appendChild(wrapper);
    });
  }
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = document.getElementById('admin-title').value.trim();
    const brand = document.getElementById('admin-brand').value.trim();
    const price = Number(document.getElementById('admin-price').value) || 0;
    const img = document.getElementById('admin-img').value.trim() || 'https://via.placeholder.com/400';
    const sizes = (document.getElementById('admin-sizes').value || '').split(',').map(s=>Number(s.trim())).filter(Boolean);
    if(!title||!brand||!price){ alert('Please fill basic fields'); return; }
    const prods = loadProducts();
    prods.unshift({ id: 'p'+Date.now(), name:title, brand, price, images:[img], sizes, isNew:false, isBestSeller:false, discount:0 });
    saveProducts(prods);
    form.reset();
    refresh();
  });
  refresh();
}

// admin helper: render product cards already created earlier

// cart operations
function addToCart(id, qty=1, size='-'){
  const cart = loadCart();
  const found = cart.find(c=>c.id===id && c.size===size);
  if(found) found.qty += qty; else cart.push({id, qty, size});
  saveCart(cart);
}
function removeCartItem(idx){
  const cart = loadCart();
  cart.splice(idx,1);
  saveCart(cart);
}

// bootstrapping per page
document.addEventListener('DOMContentLoaded', ()=>{
  // ensure products exist
  loadProducts();
  updateCartCount();
  // year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const page = document.body.dataset.page;
  if(page === 'home'){ renderFeatured(); }
  if(page === 'shop'){ renderShop(); }
  if(page === 'product'){ renderProductDetail(); }
  if(page === 'cart'){ renderCartPage(); }
  if(page === 'checkout'){ renderCheckoutPage(); }
  if(page === 'account'){ renderAccountPage(); }
  if(page === 'admin'){ renderAdminPage(); }

  // universal: attach add-to-cart buttons rendered elsewhere (if any)
  document.body.addEventListener('click', (e)=>{
    if(e.target.matches('.add-now')) {
      const id = e.target.dataset.id;
      addToCart(id,1);
      alert('Added to cart');
      updateCartCount();
    }
  });
});
