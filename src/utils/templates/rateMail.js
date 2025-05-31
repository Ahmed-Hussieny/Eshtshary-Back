export const rateEmailTemplate = (name, link) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rate Your Experience</title>
    <style>
    </style>
  </head>
  <body>
    <div class="container">
      <p>مرحبا ${name}،</p>
      <p>حبينا نطمن عليك ونقول شكرًا إنك كنت معانا</p>
      <p>لو عندك دقيقة، قولنا رأيك هنا</p>
      <a href="${link}">تقييم تجربتي</a>
      <p>إحنا جاهزين ودايما مع بعض</p>
      <div class="footer">
        <p>مع خالص التحيات،</p>
        <p>فريق Arab ADHD</p>
      </div>
    </div>
  </body>
</html>`;
};
