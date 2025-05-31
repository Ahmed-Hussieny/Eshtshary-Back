export const prePaymentSessionTemplate = (name, service) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Session</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>شكرًا على الدفع! استلمنا طلبك، وهو دلوقتي قيد المراجعة من فريقنا.</p>
            <p>الخدمة اللي حجزتها: ${service}</p>
            <p>حالة الدفع: قيد المراجعة</p>
            <p>هنأكد لك فورًا أول ما يتم التحقق من الدفع، وهيوصلك كل التفاصيل بعدها مباشرة.</p>
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