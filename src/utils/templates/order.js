export const prePaymentOrderTemplate = (name, order) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmation</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>شكرًا على طلبك! استلمنا طلبك، وهو دلوقتي قيد المراجعة من فريقنا.</p>
            <p>طلب رقم : ${order._id}</p>
            <p>حالة الطلب: قيد المراجعة</p>
            <ul>
            ${order.orderItems
              .map(
                (item) => `
            <li>${item.title} - الكمية: ${item.quantity} - السعر: ${item.price} جنيه</li>
            `
              )
              .join("")}
        </ul>
        <p>عنوان الشحن: ${order.shippingAddress.address}, ${
    order.shippingAddress.city
  }, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</p>
        <p>رقم الهاتف: ${order.phoneNumber}</p>
        <p>السعر الإجمالي: ${order.totalPrice} جنيه</p>
            <p>هنأكد لك فورًا أول ما يتم التحقق من الطلب، وهيوصلك كل التفاصيل بعدها مباشرة.</p>
            <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `;
};

export const orderPaidTemplate = (username, order) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Therapist Acceptance</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>مرحبًا ${username}،</h2>
        <p>شكرًا لطلبك من متجر Arab ADHD!</p>
        <p>حابين نأكد إننا استلمنا طلبك، وهنبدأ تجهيزه على طول.</p>
        <p>تفاصيل الطلب:</p>
        <ul>
            ${order.orderItems
              .map(
                (item) => `
            <li>${item.title} - الكمية: ${item.quantity} - السعر: ${item.price} جنيه</li>
            `
              )
              .join("")}
        </ul>
        <p>عنوان الشحن: ${order.shippingAddress.address}, ${
    order.shippingAddress.city
  }, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</p>
        <p>رقم الهاتف: ${order.phoneNumber}</p>
        <p>السعر الإجمالي: ${order.totalPrice} جنيه</p>
        <p>نحن نعمل على تجهيز طلبك وسنقوم بإبلاغك عند الشحن.</p>
        <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
        <p>شكرًا لك!</p>
        </div>
        <div style="margin-top: 20px; font-size: 0.9em; color: #777;">
            <p>فريق Arab ADHD</p>
            <p>للاستفسارات، يرجى التواصل معنا عبر البريد الإلكتروني أو الهاتف.</p>
        </div>
    </body>
</html>
    `;
};

export const orderPlacedTemplate = (username, order) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Placed</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>مرحبًا ${username}،</h2>
        <p>حابين نطمنك إن طلبك من متجر Arab ADHD تم شحنه خلاص، وجاي لك في الطريق!</p>
        <p>تفاصيل الطلب:</p>
        <ul>
            ${order.orderItems
              .map(
                (item) => `
            <li>${item.title} - الكمية: ${item.quantity} - السعر: ${item.price} جنيه</li>
            `
              )
              .join("")}
        </ul>
        <p>السعر الإجمالي: ${order.totalPrice} جنيه</p>
        <p>إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا.</p>
        <p>شكرًا لك!</p>
        </div>
        <div style="margin-top: 20px; font-size: 0.9em; color: #777;">
            <p>فريق Arab ADHD</p>
            <p>للاستفسارات، يرجى التواصل معنا عبر البريد الإلكتروني أو الهاتف.</p>
        </div>
    </body>
</html>
    `;
};

export const orderDeliveredTemplate = (username, feedbackLink) => {
  return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Delivered</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>مرحبًا ${username}،</h2>
        <p>بنتمنا تكون استلمت طلبك من متجر Arab ADHD بكل حب وراحة</p>
        <p>حابين نعرف رأيك في تجربتك معانا، لو عندك دقيقة، شاركنا رأيك من خلال الرابط ده:</p>
        <p><a href="${feedbackLink}" style="color: #1a73e8;">رابط تقييم الطلب</a></p>
        
        <p>إذا كان لديك أي استفسارات أو تحتاج إلى مساعدة، لا تتردد في التواصل معنا.</p>
        <p>شكرًا لك على اختيار Arab ADHD!</p>
        </div>
        <div style="margin-top: 20px; font-size: 0.9em; color: #777;">
            <p>فريق Arab ADHD</p>
            <p>للاستفسارات، يرجى التواصل معنا عبر البريد الإلكتروني أو الهاتف.</p>
        </div>
    </body>
</html>
    `;
}
