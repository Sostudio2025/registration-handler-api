const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuration from Railway environment variables
const config = {
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    PORT: process.env.PORT || 3001,
    BASE_ID: process.env.AIRTABLE_BASE_ID || 'appL1FfUaRbmPNI01'
};


const registrationSystemPrompt = `אתה עוזר מיוחד לטיפול בהשלמת הרשמה ודמי רצינות במערכת ניהול לקוחות.

🚨 הוראה קריטית:
לעולם אל תעצור באמצע התהליך! גם אם מצאת מידע או ביצעת פעולה - תמיד המשך לשלב הבא עד לסיום כל 5 השלבים. אל תחכה לאישור נוסף אלא אם כן נדרש במפורש בהוראות.

🎯 תפקידך העיקרי:
לנהל את תהליך השלמת הרשמה של לקוחות לפרויקטים, כולל עדכון סטטוסים ויצירת עסקאות.

⚡ חוק הזהב: 
בצע את כל 5 השלבים ברצף! אל תעצור באמצע גם אם:
- מצאת את הלקוח - המשך לבדוק סטטוס
- הסטטוס כבר מעודכן - המשך לבדוק עסקאות
- יש עסקה קיימת - עדיין הצע אפשרויות המשך
- יצרת עסקה - תמיד שאל על פרטים נוספים

📋 תהליך הפעולה שלך (בצע את כולם בסדר הזה):
1️⃣ מציאת הלקוח:
- חפש את הלקוח בטבלת הלקוחות (Customers)
- אם לא נמצא: "❌ לא מצאתי לקוח בשם [שם]. האם לחפש שם אחר?"
- אם נמצאו כמה: "⚠️ מצאתי [מספר] לקוחות בשם [שם]. אנא דייק יותר או בחר מהרשימה:"
- אם נמצא אחד: "✅ מצאתי את [שם הלקוח]" והמשך לשלב הבא

2️⃣ בדיקת סטטוס הלקוח:
- בדוק אם הסטטוס הנוכחי הוא "לקוח בתהליך"
- אם כן: "✅ הלקוח כבר בסטטוס 'לקוח בתהליך'" והמשך לשלב הבא
- אם לא: "🔄 הסטטוס הנוכחי: [סטטוס]. האם לעדכן ל'לקוח בתהליך'? (כן/לא)"
  - אם המשתמש אומר כן: עדכן והמשך
  - אם המשתמש אומר לא: המשך בלי לעדכן

3️⃣ בדיקת עסקה קיימת:
- חפש בטבלת העסקאות (Transactions) עסקה שמקושרת גם ללקוח וגם לפרויקט
- אם נמצאה עסקה קיימת:
  "📌 כבר קיימת עסקה עבור [שם לקוח] בפרויקט [שם פרויקט]:
   • מספר עסקה: [ID]
   • סטטוס: [סטטוס עסקה]
   • תאריך יצירה: [תאריך]
   האם לעדכן את העסקה הקיימת או ליצור חדשה? (עדכן/חדשה/ביטול)"
- אם לא נמצאה: המשך לשלב הבא

4️⃣ יצירת עסקה חדשה:
- צור רשומה חדשה בטבלת העסקאות עם:
  • קישור ללקוח
  • קישור לפרויקט
  • שם העסקה: "[שם לקוח] - [שם פרויקט]"
  • סטטוס עסקה: "בתהליך"
  • סטטוס לקוח בעסקה: "השלים הרשמה"
  • דמי רצינות שולמו: כן
  • תאריך השלמת הרשמה: היום
- הודע: "✅ נוצרה עסקה חדשה בהצלחה! מספר: [ID]"

5️⃣ הצעת צעדים נוספים:
תמיד שאל: "🤔 האם תרצה להוסיף פרטים נוספים לעסקה? למשל:
- גודל משרד
- קומה
- מחיר
- הערות
- פרטי עורך דין
- מסמכים

מה תרצה להוסיף? (או 'לא' לסיום)"

⚠️ כללים חשובים:
- ענה תמיד ורק בעברית
- תמיד הצע את הצעד הבא בתהליך
- אל תדלג על שלבים - עבור לפי הסדר
- בכל שלב הצג בבירור מה קורה ומה הצעד הבא
- השתמש באימוג'ים לבהירות (✅❌🔄📌🤔)
- אם משהו לא ברור - שאל שאלה ממוקדת
- תמיד הצג אפשרויות בחירה כשרלוונטי

💡 דוגמאות לתגובות:

כשמקבלים: "יוסי כהן השלים הרשמה בפארק רעננה"
תגובה: "🔍 מחפש את יוסי כהן במערכת..."

כשמבקשים להוסיף מידע:
"בחר מה להוסיף:
1. גודל משרד (מ"ר)
2. קומה
3. מחיר עסקה
4. הערות
5. אחר

מה תרצה להוסיף? (מספר או תיאור)"

זכור: המטרה היא לעשות את התהליך חלק, ברור ומקצועי!

⛔ אסור:
- לעצור אחרי מציאת לקוח ולהגיד "מצאתי" בלי להמשיך
- לסיים אחרי עדכון סטטוס בלי לבדוק עסקאות
- להפסיק אחרי יצירת עסקה בלי להציע צעדים נוספים
- לדלג על שלבים גם אם נראה שאין בהם צורך

✅ חובה:
- לעבור על כל 5 השלבים בכל מקרה
- להציע תמיד את הצעד הבא
- להשלים את כל התהליך מההתחלה ועד הסוף`;

// Table IDs
const TABLES = {
    customers: 'tblcTFGg6WyKkO5kq',
    projects: 'tbl9p6XdUrecy2h7G', 
    deals: 'tblSgYN8CbQcxeT0j'
};

// ========== Helper Functions ==========
async function searchRecords(tableId, searchTerm) {
    try {
        const url = `https://api.airtable.com/v0/${config.BASE_ID}/${tableId}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${config.AIRTABLE_API_KEY}`
            }
        });

        const records = response.data.records;
        const filteredRecords = records.filter(record =>
            JSON.stringify(record.fields).toLowerCase().includes(searchTerm.toLowerCase())
        );

        return {
            found: filteredRecords.length,
            records: filteredRecords
        };
    } catch (error) {
        console.error('Search error:', error.message);
        throw new Error(`Search failed: ${error.message}`);
    }
}

async function searchTransactions(customerId, projectId) {
    try {
        const url = `https://api.airtable.com/v0/${config.BASE_ID}/${TABLES.deals}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${config.AIRTABLE_API_KEY}`
            }
        });

        const records = response.data.records;
        const matchingTransactions = records.filter(record => {
            const fields = record.fields;
            const linkedCustomer = fields['מזהה לקוח ראשי (ID_Client)'];
            const linkedProject = fields['מזהה פרויקט (ID_Project)'];

            return (linkedCustomer && linkedCustomer.includes(customerId)) &&
                   (linkedProject && linkedProject.includes(projectId));
        });

        return {
            found: matchingTransactions.length,
            transactions: matchingTransactions
        };
    } catch (error) {
        throw new Error(`Transaction search failed: ${error.message}`);
    }
}

async function createRecord(tableId, fields) {
    try {
        const url = `https://api.airtable.com/v0/${config.BASE_ID}/${tableId}`;
        const response = await axios.post(url, {
            fields: fields
        }, {
            headers: {
                'Authorization': `Bearer ${config.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Create record failed: ${errorMessage}`);
    }
}

async function updateRecord(tableId, recordId, fields) {
    try {
        const url = `https://api.airtable.com/v0/${config.BASE_ID}/${tableId}`;
        const response = await axios.patch(url, {
            records: [{
                id: recordId,
                fields: fields
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${config.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.records[0];
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Update record failed: ${errorMessage}`);
    }
}

// ========== Main Registration Process ==========
async function processRegistration(customerName, projectName, options = {}) {
    const result = {
        success: false,
        message: '',
        steps: [],
        data: {}
    };

    try {
        // Step 1: Search Customer
        console.log('🔍 Searching for customer:', customerName);
        const customerSearch = await searchRecords(TABLES.customers, customerName);
        
        if (customerSearch.found === 0) {
            result.message = `❌ לא נמצא לקוח בשם "${customerName}"`;
            return result;
        }
        
        if (customerSearch.found > 1) {
            result.message = `⚠️ נמצאו ${customerSearch.found} לקוחות בשם "${customerName}"`;
            result.data.customers = customerSearch.records.map(r => ({
                id: r.id,
                name: r.fields['שם מלא'],
                phone: r.fields['טלפון']
            }));
            return result;
        }
        
        const customer = customerSearch.records[0];
        result.data.customer = customer;
        
        // Step 2: Search Project
        console.log('🔍 Searching for project:', projectName);
        const projectSearch = await searchRecords(TABLES.projects, projectName);
        
        if (projectSearch.found === 0) {
            result.message = `❌ לא נמצא פרויקט בשם "${projectName}"`;
            return result;
        }
        
        if (projectSearch.found > 1) {
            result.message = `⚠️ נמצאו ${projectSearch.found} פרויקטים בשם "${projectName}"`;
            result.data.projects = projectSearch.records.map(r => ({
                id: r.id,
                name: r.fields['שם הפרויקט']
            }));
            return result;
        }
        
        const project = projectSearch.records[0];
        result.data.project = project;
        
        // Step 3: Check Existing Deal
        console.log('🔍 Checking existing deals');
        const existingDeals = await searchTransactions(customer.id, project.id);
        
        if (existingDeals.found > 0) {
            result.success = true;
            result.message = `✅ כבר קיימת עסקה עבור ${customer.fields['שם מלא']} בפרויקט ${project.fields['שם הפרויקט']}`;
            result.data.existingDeal = existingDeals.transactions[0];
            return result;
        }
        
        // Step 4: Create New Deal
        console.log('🆕 Creating new deal');
        const today = new Date().toISOString().split('T')[0];
        const dealName = `${customer.fields['שם מלא']} - ${project.fields['שם הפרויקט']}`;
        
        const newDealFields = {
            "שם העסקה": dealName,
            "מזהה לקוח ראשי (ID_Client)": [customer.id],
            "מזהה פרויקט (ID_Project)": [project.id],
            "סטטוס עסקה": "בתהליך",
            "סטטוס לקוח בעסקה": "השלים הרשמה",
            "דמי רצינות שולמו": true,
            "תאריך השלמת הרשמה": today
        };
        
        const newDeal = await createRecord(TABLES.deals, newDealFields);
        result.data.newDeal = newDeal;
        
        // Step 5: Update Customer Status
        console.log('🔄 Updating customer status');
        const currentStatus = customer.fields['סטטוס'];
        if (!['לקוח בתהליך', 'לקוח רכש'].includes(currentStatus)) {
            await updateRecord(TABLES.customers, customer.id, {
                "סטטוס": "לקוח בתהליך"
            });
            result.data.statusUpdated = true;
        }
        
        result.success = true;
        result.message = `✅ הושלם בהצלחה!\n` +
            `📋 נוצרה עסקה: ${dealName}\n` +
            `📄 מספר: ${newDeal.id}\n` +
            (result.data.statusUpdated ? `📝 סטטוס הלקוח עודכן\n` : '');
        
        return result;
        
    } catch (error) {
        console.error('Process error:', error);
        result.message = `❌ שגיאה: ${error.message}`;
        return result;
    }
}

// ========== Helper Functions ==========
function isRegistrationRequest(message) {
    const keywords = [
        'השלים הרשמה', 'השלימה הרשמה',
        'העביר דמי רצינות', 'העבירה דמי רצינות',
        'שילם דמי רצינות', 'שילמה דמי רצינות'
    ];
    
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
}

function extractNamesFromMessage(message) {
    const patterns = [
        /(.+?)\s+השלי(?:ם|מה)\s+הרשמה\s+(?:ל|ב|לפרויקט|בפרויקט)\s+(.+)/,
        /(.+?)\s+העביר(?:ה)?\s+דמי\s+רצינות\s+(?:ל|ב|לפרויקט|בפרויקט)\s+(.+)/
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            return {
                customerName: match[1].trim(),
                projectName: match[2].trim()
            };
        }
    }
    
    return null;
}

// ========== API Endpoints ==========
app.get('/', (req, res) => {
    res.json({
        service: 'Registration Handler API',
        status: 'OK',
        version: '1.0.0',
        endpoints: {
            health: 'GET /',
            complete: 'POST /api/registration/complete',
            processMessage: 'POST /api/registration/process-message',
            parseMessage: 'POST /api/registration/parse-message'
        }
    });
});

// Complete registration
app.post('/api/registration/complete', async (req, res) => {
    try {
        const { customerName, projectName, options } = req.body;
        
        if (!customerName || !projectName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customerName, projectName'
            });
        }
        
        const result = await processRegistration(customerName, projectName, options);
        
        res.status(result.success ? 200 : 400).json(result);
        
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Process WhatsApp message
app.post('/api/registration/process-message', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Missing message'
            });
        }
        
        if (!isRegistrationRequest(message)) {
            return res.json({
                success: false,
                isRegistrationRequest: false,
                message: 'Not a registration request'
            });
        }
        
        const names = extractNamesFromMessage(message);
        if (!names) {
            return res.json({
                success: false,
                isRegistrationRequest: true,
                needsMoreInfo: true,
                message: 'Could not extract names from message'
            });
        }
        
        const result = await processRegistration(names.customerName, names.projectName);
        
        res.json({
            ...result,
            isRegistrationRequest: true,
            extractedNames: names
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Parse message
app.post('/api/registration/parse-message', async (req, res) => {
    try {
        const { message } = req.body;
        
        const isRegistration = isRegistrationRequest(message);
        const names = extractNamesFromMessage(message);
        
        res.json({
            success: true,
            isRegistrationRequest: isRegistration,
            extractedData: names,
            originalMessage: message
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
    console.log(`📍 Ready to handle registration requests`);
    if (!config.AIRTABLE_API_KEY) {
        console.warn('⚠️  Warning: AIRTABLE_API_KEY not set!');
    }
});
