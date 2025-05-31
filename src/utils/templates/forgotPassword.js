export const forgotPasswordTemplate = (name, link) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <style>
    </style>
  </head>
  <body>
    <div class="container">
      <p>مرحبا ${name}،</p>
      <p>يومك مبهج وجميل زي قلبك</p>
      <p>وصلك طلب استعادة كلمة المرور لـ حسابك على Arab ADHD.</p>
      <p>اضغط هنا علشان تعيّن كلمة سر جديدة:</p>
      <a href="${link}"
        >إعادة تعيين كلمة المرور</a
      >
      <p>لو ما كنتش أنت اللي طلبت ده، تجاهل الإيميل ببساطة.</p>

      <div class="footer">
        <p>معاك دايمًا،</p>
        <p>فريق Arab ADHD</p>
      </div>
    </div>
  </body>
</html>
`;
};
