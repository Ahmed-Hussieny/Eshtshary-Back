export const reminder24SessionTemplate = (name, nameTherapist, timeOfSession, link) => {
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
                <p>حابين نفكّرك إن عندك جلسة بكرة على Arab ADHD!</p>
                <p>جلسة علاجيه مع ${nameTherapist}</p>
                <p>الوقت: ${timeOfSession}</p>
                <p>الرجاء الاجابة على الأسئلة التالية قبل الجلسة:</p>
                <a href="${link}">الأسئلة</a>
                <p>لو عندك أي استفسار، إحنا موجودين</p>
                <p>بالتوفيق دايمًا</p>
                <div class="footer">
                    <p>مع خالص التحيات،</p>
                    <p>فريق Arab ADHD</p>
                </div>
            </div>
        </body>
    </html>
    `;
};

export const reminder24SessionTemplateTherapist = (name, nameClient, timeOfSession) => {
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
                    <p>تذكير سريع إن عندك جلسة بكرة ضمن جدولك على Arab ADHD:</p>
                    <p>جلسة مع ${nameClient}</p>
                    <p>الوقت: ${timeOfSession}</p>
                    <p>لو عندك أي استفسار، إحنا موجودين</p>
                    <p>بالتوفيق دايمًا</p>
                    <div class="footer">
                        <p>مع خالص التحيات،</p>
                        <p>فريق Arab ADHD</p>
                    </div>
                </div>
            </body>
        </html>
        `;
};


export const reminder1SessionTemplate = (name, nameTherapist, timeOfSession, link) => {
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
                <p>يا ترى جاهز؟</p>
                <p>فاضل ساعة واحدة بس على جلستك مع Arab ADHD!</p>
                <p>جلسة علاجيه مع ${nameTherapist}</p>
                <p>الوقت: ${timeOfSession}</p>
                <a href="${link}">رابط الجلسة</a>
                <p>جهّز مكان هادي، شوية مية أو قهوة ، ومزاجك الحلو</p>
                <p>لو عندك أي استفسار، إحنا موجودين</p>
                <p>معاك دايمًا،</p>
                <div class="footer">
                    <p>مع خالص التحيات،</p>
                    <p>فريق Arab ADHD</p>
                </div>
            </div>
        </body>
    </html>
    `;
};

export const reminder1SessionTemplateTherapist = (name, nameClient, timeOfSession, link) => {
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
                <p>تذكير بسيط إن عندك جلسة بعد ساعة مع أحد عملائنا الرائعين ?</p>
                <p>جلسة مع ${nameClient}</p>
                <p>الوقت: ${timeOfSession}</p>
                <a href="${link}">رابط الجلسة</a>
                <p>نتمنالك جلسة سلسة ومثمرة كالعادة</p>
                <p>لو عندك أي استفسار، إحنا موجودين</p>
                <p>كل التقدير</p>
                <div class="footer">
                    <p>مع خالص التحيات،</p>
                    <p>فريق Arab ADHD</p>
                </div>
            </div>
        </body>
    </html>
    `;
};