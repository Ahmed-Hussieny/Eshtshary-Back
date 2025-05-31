export const acceptTherapistTemplate = (name, email, password, link) => {
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
            <p>يا مليون مرحبا يا ${name}،</p>
            <p>مبروك! حسابك كـ معالج/مستشار على Arab ADHD اتفعل رسميًا</p>
            <p>واحنا متحمسين جدًا تبدأ معانا وتكون جزء من رحلتنا في دعم مجتمع الـADHDers</p>

            <p>بيانات الدخول الخاصة بيك:</p>
            <p>البريد الإلكتروني: ${email}</p>
            <p>كلمة المرور : ${password}</p>
            <a href="${link}">رابط تسجيل الدخول</a>

            <p>قبل تبدأ تستقبل جلسات، ياريت تدخل تضبط حسابك:</p>
            <ul>
                <li>حدّث بياناتك الشخصية</li>
                <li>أضف المواعيد المتاحة للجلسات</li>
                <li>راجع باقة الخدمات والأسعار</li>
            </ul>

            <p>لو احتجت أي مساعدة، فريق الدعم دايمًا معاك</p>
            <p>جاهزين نبدأ الشغل الحلو؟</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `;
};

export const rejectTherapistTemplate = (name) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Therapist Rejection</title>
    </head>
    <body>
        <div class="container">
            <p>يا هلا بيك يا ${name}،</p>
            <p>أولًا، شكرًا جدًا إنك أخدت من وقتك وقدمت للانضمام كمعالج على Arab ADHD.</p>
            <p>راجعنا بياناتك بكل تقدير، وبعد تفكير، قررنا في الوقت الحالي عدم المضي قدمًا في تفعيل الحساب.</p>
            <p>ده لا يقلل أبدًا من خبرتك أو قيمتك – القرار متعلق بمعايير معينة للمرحلة اللي إحنا فيها حاليًا.</p>
            <p>ممكن نرجع نفتح باب التسجيل لاحقًا، وهنكون سعداء نسمع عنك وقتها</p>
            <p>ولو عندك أي استفسار أو ملاحظات، إحنا بنرحّب بيها في أي وقت.</p>
            <p>نتمنى لك كل التوفيق في مسيرتك المهنية، ونشجعك على إعادة التقديم في المستقبل.</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `;
}