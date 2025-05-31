export const resetPasswordTemplate = (name) => {
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
      <p>أهلاً ${name}،</p>
      <p>تم تغيير كلمة المرور الخاصة بحسابك على Arab ADHD بنجاح.</p>
      <p>لو أنت اللي عملت التغيير، كله تمام</p>
      <p>ولو مش أنت، تواصل معانا فورًا علشان نأمّن حسابك</p>
      <div class="footer">
        <p>دايمًا في ضهرك،</p>
        <p>فريق Arab ADHD</p>
      </div>
    </div>
  </body>
</html>
`;
};
