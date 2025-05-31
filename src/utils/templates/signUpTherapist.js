export const signUpTherapistThemplate = (name) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Therapist Acceptance</title>
    </head>
    <body>
        <div class="container">
            <p>يا مراحب يا ${name}،</p>
            <p>احنا مبسوطين جدًا إنك اخترت تنضم لعيلة Arab ADHD!</p>
            <p>خطوة تسجيلك وصلت، وده أول الطريق علشان نشتغل سوا ونوصل دعمنا للي محتاجه. </p>
            <p>️️ دلوقتي فريقنا بيراجع بياناتك وملفك علشان نضمن أفضل تجربة لكل المستخدمين.</p>
                        <p>️️ ده بياخد عادة حد أقصى 72 ساعة، وبعدها هنبعت لك على طول:</p>
            <p>تأكيد قبول الحساب</p>

            <p>كلمة المرور الخاصة بك</p>
            <p>رابط الدخول للوحة التحكم</p>
            <p>لو عندك أي استفسار في الوقت ده، إحنا دايمًا بنرد بسرعة</p>
            <p>شكرًا لأنك قررت تكون جزء من رحلتنا</p>
            
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `;
};
