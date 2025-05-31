export const welcomeUserTemplate = (name, link) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Arab ADHD</title>
    <style>
    </style>
  </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>أهلاً بك في Arab ADHD!</p>
            <p>احنا مبسوطين جدًا إنك انضمّيت لعيلة Arab ADHD</p>
            <p>المنصة دي معمولة مخصوص علشانك – استشارات، كورسات، أدوات، وكل الدعم اللي تحتاجه في رحلتك</p>
            <a href="${link}">ابدأ من هنا:</a>
            <p>لو احتجت أي مساعدة، فريقنا دايمًا جاهز ليك.</p>
            <div class="footer">
            <p>مع خالص التحيات،</p>
            <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `;
};