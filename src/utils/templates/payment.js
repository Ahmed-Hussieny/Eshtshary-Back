export const acceptPaymentSessionTemplate = (name, therapist, sessions) => {
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
            <p>يومك مبهج وجميل زي قلبك</p>
            <p>حجزك تم بنجاح!</p>
            <p> جلسات علاجيه مع ${therapist}</p>
            <p>تفاصيل الجلسات:</p>
            <ul>
                ${sessions.map(
                    (session) => `
                    <li>
                        تاريخ الجلسة: ${session.date} <br>
                        وقت البدء: ${session.startTime} <br>
                    </li>
                `
                ).join('')}
            </ul>
            <p>الجلسات هتكون أونلاين على منصة زوم</p>
            <p>هتوصلك كل التفاصيل والرابط قبل ميعاد كل جلسة</p>
            <p>لو في أي استفسار، إحنا موجودين</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `
};

export const acceptPaymentSessionTemplateTherapist = (name,username, sessions) => {
    return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Session</title>
    </head>
    <body>
        <p>  مرحبا ${name} ,</p>
        <p>تم حجز جلسة جديدة مع ${username} .</p>
        <p>تفاصيل الجلسة:</p>
        <ul>
            ${sessions.map(
                (session) => `
            <li>
                تاريخ الجلسة: ${session.date} <br>
                وقت البدء: ${session.startTime} <br>
                وقت الانتهاء: ${session.endTime} <br>
            </li>
        `
            ).join('')}
        </ul>
        <p>الجلسات هتكون أونلاين على منصة زوم</p>
        <p>هتوصلك كل التفاصيل والرابط قبل ميعاد كل جلسة</p>
        <p>لو في أي استفسار، إحنا موجودين</p>
        <div class="footer">
            <p>مع خالص التحيات،</p>
            <p>فريق Arab ADHD</p>
        </div>
    </body>
</html>
`
};

export const rejectPaymentSessionTemplate = (name, sessions) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Session Rejection</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>يومك مبهج وجميل زي قلبك</p>
            <p>للأسف، تم رفض طلب الدفع لجلسة العلاجية.</p>
            <p>تفاصيل الجلسات:</p>
            <ul>
                ${sessions.map(
                    (session) => `
                    <li>
                        تاريخ الجلسة: ${session.date} <br>
                        وقت البدء: ${session.startTime} <br>
                    </li>
                `
                ).join('')}
            </ul>

            <p>لو في أي استفسار، إحنا موجودين</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `
};


export const acceptPaymentCourseTemplete = (name, paymentWallet) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Course</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>يومك مبهج وجميل زي قلبك</p>
            <p>تم الاشتراك في الدورة بنجاح!</p>
            <p>تفاصيل الدورة:</p>
            <ul>
                <li>عنوان الدورة: ${paymentWallet.courseId.title}</li>
                <li>وصف الدورة: ${paymentWallet.courseId.description}</li>
                <li>السعر: ${paymentWallet.amount} جنيه مصري</li>
            </ul>
            <p>لو في أي استفسار، إحنا موجودين</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `
}


export const acceptPaymentLiveCourseTemplete = (name, paymentWallet) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Course</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>يومك مبهج وجميل زي قلبك</p>
            <p>تم الاشتراك في الدورة بنجاح!</p>
            <p>تفاصيل الدورة:</p>
            <ul>
                <li>عنوان الدورة: ${paymentWallet.liveCourseId.title}</li>
                <li>وصف الدورة: ${paymentWallet.liveCourseId.description}</li>
                <li>السعر: ${paymentWallet.amount} جنيه مصري</li>
            </ul>
            <p>لو في أي استفسار، إحنا موجودين</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `
}

export const rejectPaymentCourseTemplate = (name, paymentWallet) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Course Rejection</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>يومك مبهج وجميل زي قلبك</p>
            <p>للأسف، تم رفض طلب الدفع للدورة.</p>
            <p>تفاصيل الدورة:</p>
            <ul>
                <li>عنوان الدورة: ${paymentWallet.courseId.title}</li>
                <li>السعر: ${paymentWallet.amount} جنيه مصري</li>
            </ul>
            <p>لو في أي استفسار، إحنا موجودين</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `
};

export const rejectPaymentLiveCourseTemplate = (name, paymentWallet) => {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Course Rejection</title>
    </head>
    <body>
        <div class="container">
            <p>مرحبا ${name}،</p>
            <p>يومك مبهج وجميل زي قلبك</p>
            <p>للأسف، تم رفض طلب الدفع للدورة.</p>
            <p>تفاصيل الدورة:</p>
            <ul>
                <li>عنوان الدورة: ${paymentWallet.liveCourseId.title}</li>
                <li>السعر: ${paymentWallet.amount} جنيه مصري</li>
            </ul>
            <p>لو في أي استفسار، إحنا موجودين</p>
            <div class="footer">
                <p>مع خالص التحيات،</p>
                <p>فريق Arab ADHD</p>
            </div>
        </div>
    </body>
</html>
    `
};