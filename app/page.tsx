"use client";

import { useEffect, useRef, useState } from "react";

const SHIPPING = 0;

interface Feature { icon: string; title: string; desc: string; }
interface ContentItem { title: string; desc: string; price: string; }

interface ProductData {
  titleAr: string;
  subtitleAr: string;
  pitchAr: string;
  images: string[];
  videos: string[];
  features: Feature[];
  contents: ContentItem[];
  price: number;
  oldPrice: number;
  discountCode: string | null;
  discountAmount: number;
}

const FALLBACK: ProductData = {
  titleAr: "عرض اليوم المييز للمتزوجين",
  subtitleAr: "🔒 خصوصية تامة • 5 سرعات تدليك • تشغيل فائق الهدوء",
  pitchAr: "جرّبوا تجربة لا مثيل لها… عرض مصمم خصوصاً ليكم، بسعر لا يُقاوَم! 🎁",
  images: ["/images/product-main.jpeg", "/images/product-2.jpeg", "/images/product-3.jpeg"],
  videos: [],
  features: [],
  contents: [],
  price: 749,
  oldPrice: 1100,
  discountCode: "SAVE50",
  discountAmount: 50,
};

export default function Home() {
  const [product, setProduct] = useState<ProductData>(FALLBACK);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [closed, setClosed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [discCode, setDiscCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(0);
  const [discMsg, setDiscMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [discDisabled, setDiscDisabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    name: string; phone: string; gov: string; total: number;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_ADMIN_API_URL + "/api/single-product";
    fetch(url)
      .then((res) => {
        if (res.status === 404) setClosed(true);
        return res.ok ? res.json() : null;
      })
      .then((json) => {
        if (json?.product) setProduct(json.product);
      })
      .catch(() => {
        // keep FALLBACK on error
      })
      .finally(() => setLoadingProduct(false));
  }, []);

  const total = Math.max(0, product.price - discountApplied + SHIPPING);

  function applyDiscount() {
    const code = discCode.trim().toUpperCase();
    if (!code) {
      setDiscMsg({ text: "اكتب كود الخصم الأول.", ok: false });
      return;
    }
    if (product.discountCode && code === product.discountCode.toUpperCase()) {
      setDiscountApplied(product.discountAmount);
      setDiscMsg({ text: `تم تطبيق الكود بنجاح! خصم ${product.discountAmount} ج.م 🎉`, ok: true });
      setDiscDisabled(true);
    } else {
      setDiscountApplied(0);
      setDiscMsg({ text: "كود الخصم غير صحيح.", ok: false });
    }
  }


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const phone2 = (form.elements.namedItem("phone2") as HTMLInputElement).value.trim();
    const gov = (form.elements.namedItem("gov") as HTMLSelectElement).value;
    const address = (form.elements.namedItem("address") as HTMLTextAreaElement).value.trim();
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value.trim();

    if (!name || !phone || !gov || !address) {
      alert("أكمل البيانات المطلوبة: الاسم، رقم التليفون، المحافظة، والعنوان التفصيلي.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      alert("رقم التليفون غير صحيح، تأكد منه من فضلك.");
      return;
    }

    try {
      const url = process.env.NEXT_PUBLIC_ADMIN_API_URL + "/api/single-product-order";
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          phone2,
          gov,
          address,
          notes,
          productTitle: product.titleAr,
          total,
        }),
      });
    } catch {
      // still show success to the user even if the network call fails
    }

    setOrderDetails({ name, phone, gov, total });
    setShowSuccess(true);
    form.reset();
    setDiscountApplied(0);
    setDiscDisabled(false);
    setDiscCode("");
    setDiscMsg(null);
  }

  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach((el, i) => {
        (el as HTMLElement).style.transitionDelay = (i % 4) * 90 + "ms";
        io.observe(el);
      });
      return () => io.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add("in"));
    }
  }, [product]);

  const activeMedia = product.images[activeIndex]
    ? { src: product.images[activeIndex], label: product.titleAr }
    : { src: "/images/product-main.jpeg", label: product.titleAr };

  if (closed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 20,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24 }}>هذه الصفحة غير متاحة حالياً</h1>
        <a
          href="https://mot3a.vercel.app/"
          style={{
            background: "#fff",
            color: "#000",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          انتقل إلى الموقع الرئيسي
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="announce">
        <div className="marquee-track">
          <span>شحن سري وآمن ومجاني ✦ الدفع عند الاستلام ✦ تغليف سري وخاص ✦ خصم 32% اليوم فقط ✦ معاينة قبل الاستلام</span>
          <span>شحن سري وآمن ومجاني ✦ الدفع عند الاستلام ✦ تغليف سري وخاص ✦ خصم 32% اليوم فقط ✦ معاينة قبل الاستلام</span>
        </div>
      </div>

      <header>
        <div className="container nav">
          <div className="brand">
            <div className="logo">💜</div>
            <span>mot3a</span>
          </div>
          <a href="#order" className="nav-cta">اطلب الآن</a>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="gallery-wrap">
            <div className="hero-tag">عرض خاص حتى نفاد الكمية</div>
            <div className="gallery">
              <div className="gallery-main">
                <img src={activeMedia.src} alt={activeMedia.label} />
                <div className="badge-sale">خصم 32%</div>
              </div>
              <div className="thumbs">
                {product.images.map((src, i) => (
                  <div
                    key={i}
                    className={"thumb" + (i === activeIndex ? " active" : "")}
                    onClick={() => setActiveIndex(i)}
                  >
                    <img src={src} alt={product.titleAr} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="info">
            <h1 className="product-title">{product.titleAr}</h1>
            <div className="product-sub">{product.subtitleAr}</div>
            <p className="pitch-line">{product.pitchAr}</p>

            <div className="price-frame">
              <div className="price-label">سعر العرض  + الملحقات اليوم (بدل ما تشتري كل قطعة لوحدها):</div>
              <div className="price-row">
                <span className="price-new">{product.price}</span>
                <span style={{ fontWeight: 900, color: "var(--gold1)" }}>ج.م</span>
                <span className="price-old">{product.oldPrice} ج.م</span>
                <span className="price-save">وفر {product.oldPrice - product.price} ج.م</span>
              </div>
              <div className="price-note">الدفع عند الاستلام • كود خصم إضافي متاح أثناء الطلب 👇</div>
            </div>

            <div className="mini-facts">
              <div className="mini-fact"><span>🚚</span> شحن سري ومجاني</div>
              <div className="mini-fact"><span>💵</span> الدفع عند الاستلام</div>
              <div className="mini-fact"><span>📦</span> تغليف سري وخاص</div>
              <div className="mini-fact"><span>⭐</span> +8,500 عميل</div>
            </div>
          </div>
        </div>
      </section>
      
      <section>
        <div className="container">
          <div className="sec-head">
            <div className="kicker">ليه العرض ده اختياركم الأول؟</div>
            <h2>مميزات وفوائد العرض</h2>
          </div>
          <div className="benefits-grid">
            {product.features.map((f, i) => (
              <div className="benefit reveal" key={i}>
                <div className="ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="sec-head">
            <div className="kicker">كل قطعة على حدة</div>
            <h2>محتوى العرض والملحقات بالتفصيل</h2>
            <p>الأسعار دي لو اشتريت كل قطعة لوحدها خارج العرض 👇</p>
          </div>
          <div className="comp-grid">
            {product.contents.map((c, i) => (
              <div className="comp-item reveal" key={i}>
                <div className="num">{i + 1}</div>
                <div className="txt">
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
                <div className="price-out">{c.price} ج.م<small>سعره خارج العرض</small></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="value-box reveal">
            <div className="value-icon">🎁</div>
            <div>
              <div className="value-head">سعر العرض  + الملحقات كاملة</div>
              <div className="value-sub">كل ده مع بعض في بوكس أنيق وخاص… وبسعر الصفقة!</div>
              <div className="value-table">
                <div className="vrow"><span>سعر القطع لو اشتريتيها لوحدها</span><span className="cut">{product.oldPrice} ج.م</span></div>
                <div className="vrow"><span>سعر العرض + الملحقات كاملة</span><span>{product.price} ج.م</span></div>
                <div className="vrow total"><span>إجمالي التوفير</span><span>{product.oldPrice - product.price} ج.م ({Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%)</span></div>
              </div>
              <div className="save-big">هتوفري <b>{product.oldPrice - product.price} ج.م</b> + الشحن مجاني 🎉</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ship-confirm reveal">
            <h2>تأكيد الشحن: سريع • آمن • سري • مجاني</h2>
            <div className="checks">
              <span>شحن سريع</span>
              <span>شحن آمن ومؤمّن</span>
              <span>تغليف سري (خاص)</span>
              <span>شحن مجاني</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="sec-head">
            <div className="kicker">راحة بالكم معانا</div>
            <h2>خدمات تليق بيكم</h2>
          </div>
          <div className="services-grid">
            <div className="service reveal">
              <div className="big-ico">🚚</div>
              <h3>شحن سريع</h3>
              <p>توصيل من 3 إلى 5 أيام عمل لجميع المحافظات.</p>
            </div>
            <div className="service reveal">
              <div className="big-ico">👀</div>
              <h3>معاينة قبل الاستلام</h3>
              <p>افحص طلبك بنفسك قبل ما تدفع أي مليم.</p>
            </div>
            <div className="service reveal">
              <div className="big-ico">📦</div>
              <h3>تغليف سري (خاص)</h3>
              <p>توصيل مغلق وفي خصوصية تامة بدون أي دلالات على المحتوى.</p>
            </div>
            <div className="service reveal">
              <div className="big-ico">🎧</div>
              <h3>خدمة عملاء 24/7</h3>
              <p>فريق جاهز للرد على استفساراتكم في أي وقت وبخصوصية تامة.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="order" id="order">
        <div className="container">
          <div className="sec-head">
            <div className="kicker">خطوة واحدة تفصلك عن عرضك</div>
            <h2>أكمل طلبك الآن</h2>
          </div>

          <div className="order-card reveal">
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">الاسم بالكامل <i>*</i></label>
                  <input type="text" id="name" name="name" placeholder="مثال: أحمد محمد" required />
                </div>
                <div className="field">
                  <label htmlFor="phone">رقم التليفون <i>*</i></label>
                  <input type="tel" id="phone" name="phone" placeholder="01xxxxxxxxx" required />
                </div>
                <div className="field">
                  <label htmlFor="phone2">رقم تليفون آخر (اختياري)</label>
                  <input type="tel" id="phone2" name="phone2" placeholder="رقم تاني للتواصل" />
                </div>
                <div className="field">
                  <label htmlFor="gov">المحافظة <i>*</i></label>
                  <select id="gov" name="gov" required defaultValue="">
                    <option value="" disabled>اختر المحافظة</option>
                    {["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","الغربية","المنوفية","القليوبية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="address">العنوان التفصيلي <i>*</i></label>
                  <textarea id="address" name="address" placeholder="المنطقة، الشارع، رقم العمارة، الدور، الشقة..." required />
                </div>
                <div className="field full">
                  <label htmlFor="notes">ملاحظات إضافية</label>
                  <textarea id="notes" name="notes" placeholder="أي ملاحظات خاصة بطلبك (اختياري)" />
                </div>
              </div>

              <div className="form-note">🔒 بياناتك محمية ولن تُستخدم إلا لشحن الطلب.</div>

              <div className="summary">
                <div className="srow"><span>تكلفة الشحن</span><span className="val free">مجاني (0 ج.م)</span></div>
                <div className="srow discount-row-wrap">
                  <span>كود الخصم</span>
                  <div className="discount-row">
                    <input
                      type="text"
                      placeholder={product.discountCode ? `اكتب الكود (مثال: ${product.discountCode})` : "اكتب الكود"}
                      value={discCode}
                      onChange={(e) => setDiscCode(e.target.value)}
                      disabled={discDisabled}
                    />
                    <button type="button" className="btn btn-gold" onClick={applyDiscount} disabled={discDisabled}>
                      تطبيق
                    </button>
                  </div>
                </div>
                <div className="srow"><span>الخصم</span><span className="val disc">{discountApplied} ج.م</span></div>
                <div className="srow total"><span>الإجمالي (الدفع عند الاستلام)</span><span className="val">{total} ج.م</span></div>
              </div>
              {discMsg && (
                <div className={"disc-msg " + (discMsg.ok ? "ok" : "err")}>{discMsg.text}</div>
              )}

              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <a href="https://mot3a.vercel.app/" className="store-link">🏠 تصفح الموقع الرئيسي</a>
              </div>

              <div className="cta-row">
                <button type="submit" className="btn btn-main">✅ تأكيد الطلب</button>
              </div>
              <div className="trust-line">
                <span>💵 الدفع عند الاستلام</span>
                <span>🚚 شحن مجاني</span>
                <span>👀 معاينة قبل الدفع</span>
                <span>🔄 استرجاع مجاني</span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {showSuccess && orderDetails && (
        <div className="overlay show">
          <div className="success-card">
            <div className="check">✔</div>
            <h3>تم استلام طلبك بنجاح!</h3>
            <p>شكراً لثقتكم بنا 💜 هنتواصل معكم في أقرب وقت لتأكيد الطلب والشحن.</p>
            <div className="success-details">
              <div><span>الاسم</span><span>{orderDetails.name}</span></div>
              <div><span>رقم التليفون</span><span>{orderDetails.phone}</span></div>
              <div><span>المحافظة</span><span>{orderDetails.gov}</span></div>
              <div><span>الإجمالي</span><span style={{ color: "var(--gold1)", fontWeight: 900 }}>{orderDetails.total} ج.م</span></div>
            </div>
            <div className="cta-row" style={{ marginTop: 18 }}>
              <a href="https://mot3a.vercel.app/" className="btn-secondary">تصفح المتجر الرئيسي</a>
              <button className="btn btn-main" onClick={() => setShowSuccess(false)}>تمام</button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div>Crazy Love © {new Date().getFullYear()} — جميع الحقوق محفوظة</div>
        <div className="foot-icons">💜 💛 💜</div>
      </footer>

      <a href="#order" className="float-cta">اطلب الآن 🛒</a>
    </>
  );
}