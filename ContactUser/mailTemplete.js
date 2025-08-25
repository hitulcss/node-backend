module.exports = {
    BatchPurchase: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Thank you for purchasing the ${data.courseName}`,
            html: `<html lang="en">
            <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                    <!-- Content -->
                    <tr>
                                    <td style="padding: 0 20px 0px;">
                                        <p style="font-weight: 600; font-size: 20px;">Dear ${name},</p>
                                        <p style="font-weight: 500; font-size: 15px;">
                                        Thank you for purchasing the ${data.courseName} batch on the SD CAMPUS!
                                        <br>
                                        We are excited to have you join our batch, and we look forward to helping you achieve your learning goals.
                                        <br><br>
                                        Here is a summary of your purchase:
                                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; padding-left: 40px; padding-right: 40px;">
                                            <tr>
                                                <th style="border: 1px solid #000; padding: 5px; text-align: left;">Details</th>
                                                <th style="border: 1px solid #000; padding: 5px; text-align: left;">Value</th>
                                            </tr>
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">Batch Name</td>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">${data.courseName}</td>
                                            </tr>
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">Price</td>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">${data.price} Rs.</td>
                                            </tr>
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">Start Date</td>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">${data.startDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">Duration</td>
                                                <td style="border: 1px solid #000; padding: 5px; text-align: left;">${data.duration} weeks</td>
                                            </tr>
                                        </table>
                                        
                                        
                                        <br><br>
                                        </p>
                                        <p style="font-weight: 500; font-size: 15px;">
                                        To log in to the platform and access the batch, please visit <a href="https://www.sdcampus.com/"><span style="color:blue">Click Here</span></a> and enter your email address and password.
                                        Once you are logged in, you will be able to view the test series schedule, take the tests, and view your results.
                                        <br><br>
                                        We also offer a variety of features to help you analyze your performance and identify areas for improvement. For example, you can view your test scores, compare your performance to other students, and generate detailed reports.
                                        <br><br>
                                        If you have any questions or need assistance, please do not hesitate to contact us. : <span style="font-weight: 500; font-size: 15px; color: blue; margin: 0px"><a href="support@sdempire.co.in" style="color: blue; margin:0px">support@sdempire.co.in</a></span>
                                        <br>
                                        <span style="font-weight: 500; font-size: 15px;">
                                        Thank you for choosing SD CAMPUS!
                                        
                                        <br><br>
                                        Signed,
                                       <br>
                                       The SD CAMPUS Team
                                       <br>
                                       7428394519
                                       <br>
                                       </span>
                                       <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                                    </p>
                                    </td>
                                </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        <td align="center" style="padding: 10px 20px; ">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 0px 10px; text-align: center; ">
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px;">
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 10px;">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 10px;"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 10px;"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        };
        return result;
    },
    RegistrationEmail: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Registration Completed`,
            html: `
          <html lang="en">

          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Registration Complete</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
              
          </head>
          
          <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 20px 0">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">
                            We are excited to have you join the SD CAMPUS ! Your registration is now complete, and you can start learning right away.
                                <br><br>
                                Best,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                7428394519
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding: 10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px; ">
                        <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09"  style="margin: 10px;">
                            <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                alt="Twitter" height="40" width="40"></a>
                        <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0"  style="margin: 10px;"><img
                                src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                alt="Facebook" height="40" width="40"></a>
                        <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D"  style="margin: 10px;"><img
                                src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
          
          </html>
                  `,
        };
        return result;
    },
    BatchAddedAlert: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `New Batch Announcement - ${data.courseName}`,
            html: `
          <html lang="en">

          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Template</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                   
                    <!-- Content -->
                    <tr>
                        <td style="padding:0 20px 0">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name} ,</p>
                            <p style="font-weight: 500; font-size: 15px;">
                            We are excited to announce the launch of our new batch, ${data.courseName}, on the SD CAMPUS platform!
                            <br>
                            This batch is designed to help you prepare for the ${data.courseName} exam. The batch will cover all of the essential topics in the syllabus, and our experienced instructors will provide you with the guidance and support you need to succeed.
                            <br><br>
                            The batch will start on ${data.startDate}.
                            <br>
                            To enroll in the batch, please visit : <span style="font-weight: 500; font-size: 15px; color: blue; margin: 0px;"><a href="https://www.sdcampus.com/" style="color: blue; margin:0px;">Click here</a></span>.
                            </p>
                            <p style="font-weight: 500; font-size: 15px;">
                            We look forward to seeing you in the batch!
                            <br>
                                Best,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                7428394519
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding:10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center; ">
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px; ">
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin : 10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin : 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin : 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <!-- Unsubscribe Message -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    <!-- Copyright -->
                </table>
            </td>
        </tr>
    </table>
</body>
          
          </html>
                  `,
        };
        return result;
    },
    DeviceChangeRequest: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Device Change Request Received`,
            html: `
            <html lang="en">
            <head>
    <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 20px 0;">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">
                            The Admin has received your device change request. He will review your request and respond within 24 hours.
                            <br>
                            In the meantime, please continue to use your current device.
                            <br>
                            If you have any questions or need assistance, please do not hesitate to contact me: <span style="font-weight: 500; font-size: 15px; color: blue; margin : 0px"><a href="support@sdempire.co.in" style="color: blue; margin:0px">support@sdempire.co.in</a></span>
                            <br>
                            Thank you for your patience and understanding.

                                <br><br>
                                Signed,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding: 10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center; ">
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding:10px 20px; ">
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <!-- Unsubscribe Message -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    <!-- Copyright -->
                    
                </table>
            </td>
        </tr>
    </table>
</body>
            
            </html>
                    `,
        };
        return result;
    },
    DeviceChangeResult: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Device Change Request Approved`,
            html: `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Template</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
            </head>
            
            <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 20px 0;">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">
                            This email informs you that your device change request has been approved. Now You can use your new device.
                            Thank you for your patience and understanding.
                                <br><br>
                                Signed,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        <td align="center" style="padding: 10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center; ">
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding:10px 20px; ">
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0"style="margin: 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D"style="margin: 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <!-- Unsubscribe Message -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
            
            </html>
                    `,
        };
        return result;
    },
    TeacherRegistration: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Welcome to the team, ${name}!`,
            html: `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Template</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
            </head>
            
            <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                        <!-- Header -->
                     
                        <!-- Content -->
                        <tr>
                            <td style="padding: 0 20px 0;">
                                <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                                <p style="font-weight: 500; font-size: 15px;">
                                On behalf of the entire team at SD CAMPUS, I am thrilled to welcome you to our team! We are excited to have you join us in our mission to make education accessible and affordable for everyone. 
                                    <br><br>
                                    Signed,
                                    <br>
                                    The SD CAMPUS Team
                                    <br>
                                    <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                                </p>
                            </td>
                        </tr>
                        <!-- Call to Action Button -->
                        <tr>
                            
                            <td align="center" style="padding: 10px 20px;">
                                <hr style="border: 1px solid #ccc; margin: 10px 0;">
                                <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                    <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                                </a>
                                <hr style="border: 1px solid #ccc; margin: 10px 0;"> 
                            </td>
                            
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding:0px 20px; text-align: center; ">
                                <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                                <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                                <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                                <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                                <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            </td>
                        </tr>
                        <!-- Social Icons -->
                        <tr>
                            <td align="center" style="padding:10px 20px; ">
                                
                        
                                <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09"style="margin:10px">
                                    <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                        alt="Twitter" height="40" width="40"></a>
                                <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0"style="margin:10px"><img
                                        src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                        alt="Facebook" height="40" width="40"></a>
                                <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D"style="margin:10px"><img
                                        src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                        alt="Instagram" height="40" width="40"></a>
                            </td>
                        </tr>
                        <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>

            
            </html>
                    `,
        };
        return result;
    },
    StaffRegistration: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Welcome to the team, ${name}!`,
            html: `
            <html lang="en">
            <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 20px 0;">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">
                            On behalf of the entire team at SD CAMPUS, I am thrilled to welcome you to our team! We are excited to have you join us in our mission to make education accessible and affordable for everyone.

                                <br><br>
                                Signed,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding: 10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:10px 20px; text-align: center; ">
                            
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px; ">
                            
                    
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin : 10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin : 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin : 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
            
            </html>
                    `,
        };
        return result;
    },
    TestSeries: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Test Series Purchase Confirmation`,
            html: `
            <html lang="en">
            <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 20px 0">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">
                            Thank you for purchasing the ${data.testSeriesName} test series on the SD CAMPUS !
                                        <br><br>
                                        We are excited to have you join our test series, and we look forward to helping you prepare for your exam.
                                        <br><br>
                                        Here is a summary of your purchase:
                                        <br>
                                        Test Series Name: ${data.testSeriesName}
                                        <br>
                                        Price: ${data.price} Rs
                                        <br>          
                                        Access Duration:${data.duration} weeks
                                        <br> <br>                                                                       
                                        To log in to the platform and access the test series, please visit <a href="https://www.sdcampus.com/"><span style="color:blue;">Click Here</span></a> and enter your email address and password.
                                        Once you are logged in, you will be able to view the test series schedule, take the tests, and view your results.
                                        <br><br>
                                        We also offer a variety of features to help you analyze your performance and identify areas for improvement. For example, you can view your test scores, compare your performance to other students, and generate detailed reports.
                                        <br><br>
                                        If you have any questions or need assistance, please do not hesitate to contact us. : <span style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></span>
                                        <br>
                                        Thank you for choosing SD CAMPUS !

                                <br><br>
                                Signed,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding: 10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 0px 20px; text-align: center; ">
                            
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px;">
                    
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin:10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin:10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin:10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                    `,
        };
        return result;
    },
    ForgetPassword: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Password Reset Request`,
            html: `
            <html lang="en">
            <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 20px 0;">
                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">
                                The One Time Password for your Reseting your password is ${data.otp}.

                                <br><br>
                                Signed,
                                <br>
                                The SD CAMPUS Team
                                <br>
                                

                               
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
                        </td>
                    </tr>
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding:10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:0px 20px; text-align: center; ">
                            
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px; ">
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin:10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin:10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin:10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                    `,
        };
        return result;
    },
    twoFactorAdmin: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            cc: ['admin@sdempire.co.in','atul.y@sdempire.co.in','dky@sdempire.co.in','arun.k@sdempire.co.in'],
            subject: `Your ${data.action} verification code`,
            html: `
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Template</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                                    <!-- Header -->
                                
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding:0 20px 0;">
                                            <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                                            <p style="font-weight: 500; font-size: 15px;">
                                                2FA code
                                                <br>
                                                Here is your ${data.action} verification code :  
                                                ${data.otp}
                                                <br>
                                                Host :  ${data?.host}

                                                <br><br>
                                                Thanks,
                                                <br>
                                                The SD CAMPUS Team
                                                <br>
                                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Call to Action Button -->
                                    <tr>
                                        
                                        <td align="center" style="padding: 10px 20px;">
                                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                                            </a>
                                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                                        </td>
                                        
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 10px 20px; text-align: center; ">
                                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                                            <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                                        </td>
                                    </tr>
                                    <!-- Social Icons -->
                                    <tr>
                                        <td align="center" style="padding: 10px 20px; ">
                                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin : 10px">
                                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                                    alt="Twitter" height="40" width="40"></a>
                                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin : 10px"><img
                                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                                    alt="Facebook" height="40" width="40"></a>
                                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin : 10px"><img
                                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                                    alt="Instagram" height="40" width="40"></a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 20px; text-align: center;">
                                            <p style="font-weight: 500; font-size: 10px;">
                                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                                            <br>Uttar Pradesh 201005</p>
                                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                    `,
        };
        return result;
    },
    panelLogin: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            subject: `Your Admin Panel account has been accessed from a new IP Address`,
            html: `
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Admin Panel account has been accessed from a new IP Address</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
                
            </head>
            
            <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
          <tr>
              <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                      <!-- Content -->
                      <tr>
                          <td style="padding: 0 20px 0">
                              <p style="font-weight: 600; font-size: 25px;">Dear ${name},</p>
                              <p style="font-weight: 500; font-size: 15px;">
                              Your security is very important to us. This email address was used to access the Admin dashboard from a new IP address:
                              <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; ">
                              <div style="font-weight: 500; font-size: 15px;"> email : ${to}</div>
                              <div style="font-weight: 500; font-size: 15px; "> time : ${new Date()}</div>
                              <div style="font-weight: 500; font-size: 15px;"> IP Address : ${data.IP_Address}</div>
                              <div style="font-weight: 500; font-size: 15px;"> browser : ${data.browser}</div>
                              <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; " >
  
                              <p style="font-weight: 500; font-size: 15px;"> If this was you, you can ignore this alert. If you noticed any suspicious activity on your account or any questions or concerns 
                                   <a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></
                               <p>
                                  
                                  <br><br>
                                  Thanks,
                                  <br>
                                  The SD CAMPUS Team
                                  <br>
                                  7428394519
                                  <br>
                                  <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                              </p>
                          </td>
                      </tr>
                      <!-- Call to Action Button -->
                      <tr>
                          
                          <td align="center" style="padding: 10px 20px;">
                              <hr style="border: 1px solid #ccc; margin: 10px 0;">
                              <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                  <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                              </a>
                              <hr style="border: 1px solid #ccc; margin: 10px 0;">
                          </td>
                          
                      </tr>
                      <!-- Footer -->
                      <tr>
                          <td style="padding: 10px 20px; text-align: center;">
                              
                              <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                              <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                              <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                              <p style="font-weight: 500; font-size: 15px;">7428394520</p>
                              <hr style="border: 1px solid #ccc;">
                          </td>
                      </tr>
                      <!-- Social Icons -->
                      <tr>
                          <td align="center" style="padding: 10px 20px; ">
                          <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09"  style="margin: 10px;">
                              <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                  alt="Twitter" height="40" width="40"></a>
                          <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0"  style="margin: 10px;"><img
                                  src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                  alt="Facebook" height="40" width="40"></a>
                          <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D"  style="margin: 10px;"><img
                                  src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                  alt="Instagram" height="40" width="40"></a>
                          </td>
                      </tr>
                      <tr>
                          <td style="padding: 10px 20px; text-align: center;">
                              <p style="font-weight: 500; font-size: 10px;">
                              Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                              <br>Uttar Pradesh 201005</p>
                              <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                          </td>
                      </tr>
                      
                  </table>
              </td>
          </tr>
      </table>
  </body>
            
            </html>
                  `,
        };
        return result;
    },
    scheduleLectures: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            cc: ['ankitsharma@sdempire.co.in', 'akanksha.k@sdempire.co.in', 'support@sdempire.co.in', 'govind.s@sdempire.co.in'],
            subject: `Your Upcomming Lectures`,
            html: `
          <html lang="en">

          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Template</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                    <!-- Header -->
                   
                    <!-- Content -->
                    <tr>
            <td style="padding:0 20px 0">
                <p >Hi ${name},</p>
                <br>
                <p>Please note your schedule for paid classes.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white; border-spacing: 0;">
                    <thead>
                        <tr>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px; margin: 0;">SNO</td>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px ; margin: 0;">Date</td>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px; margin: 0;">Day</td>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;margin: 0;
                            padding: 8px">FaculityName</td>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;margin: 0;
                            padding: 8px">Batch</td>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;margin: 0;
                            padding: 8px">Timing</td>
                            <td style="border: 1px solid #dddddd;
                            text-align: left;margin: 0;
                            padding: 8px">Lecture Name</td>
                            <!-- Add other table cells based on your data structure -->
                        </tr>
                    </thead>
                    <tbody>
                        
                        
                    ${data.map((item, index) => `
                    <tr key=${index}>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${index + 1}</td>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${item.startDate}</td>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${item.day}</td>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${item.teacherName}</td>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${item.batchName}</td>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${item.startTiming + "  To  " + item.endTiming}</td>
                        <td style="border: 1px solid #dddddd; text-align: left; margin: 0; padding: 8px;">${item.lectureTopic}</td>
                    </tr>
                `).join('')}
                    </tbody>
                </table>
                <p>
                <br>
                                Regards,
                                <br>
                                SD CAMPUS Team
                                <br>
                                8130700157 / 8130700156
                                <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                            </p>
            </td>
            
          </tr>
          
                    <!-- Call to Action Button -->
                    <tr>
                        
                        <td align="center" style="padding:10px 20px;">
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                            <a href="https://www.sdcampus.com/" style="text-decoration: none;">
                                <button style="background-color: #7f11e0bf; color: white; font-weight: 600; font-size: 20px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Click Here To Know More!</button>
                            </a>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                        
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center; ">
                            <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                            <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:support@sdempire.co.in" style="color: blue;">support@sdempire.co.in</a></p>
                            <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                            <p style="font-weight: 500; font-size: 15px;">8130700157 / 8130700156</p>
                            <hr style="border: 1px solid #ccc; margin: 10px 0;">
                        </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                        <td align="center" style="padding: 10px 20px; ">
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin : 10px">
                                <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                    alt="Twitter" height="40" width="40"></a>
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin : 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                    alt="Facebook" height="40" width="40"></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin : 10px"><img
                                    src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                    alt="Instagram" height="40" width="40"></a>
                        </td>
                    </tr>
                    <!-- Unsubscribe Message -->
                    <tr>
                        <td style="padding: 10px 20px; text-align: center;">
                            <p style="font-weight: 500; font-size: 10px;">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                            <br>Uttar Pradesh 201005</p>
                            <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD CAMPUS</p>
                        </td>
                    </tr>
                    <!-- Copyright -->
                </table>
            </td>
        </tr>
    </table>
</body>
          
          </html>
                  `,
        };
        return result;
    },
    publicationWebsiteOrderPlaced: (to, name, data) => {
        let result = {
            from: `SD Publication <${process.env.email}>`,
            to,
            // cc: ['care@sdpublication.com'],
            subject: `Order Placed: Thank you for your order`,
            html: `
            <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>Order Placed</title>
                    </head>

                    <body style=" margin: 0; padding: 0;  background-color: #F2ECFF; font-family: 'Noto Sans Devanagari', sans-serif; ">
                        <table cellpadding="0" cellspacing="0" width="100%"
                            style="max-width: 600px; margin: 20px auto; background-color: white;  border-radius: 15px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <th style="background-color: #9603f2;line-height: 4 ;">
                                &nbsp;
                                <a href="https://sdpublication.com/" target="_blank"> <img
                                        src="https://static.sdcampus.com/assets/publication_transparent_logo_1742977083.png"
                                        style="width: auto;height:100px;padding-top:10px"></a>
                            </th>
                            <tr>

                                <td style="padding: 0 20px 0px;border-radius: 8px;">

                                    <table cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td>
                                                <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                                    Hi, ${name}
                                                </p>
                                                <p style="font-weight: 500; font-size: 14px; color: #333333bf">
                                                    Your order has been received and is now being processed. Your order details are shown
                                                    below for your reference:
                                                </p>
                                                <p style="font-weight: 600; font-size: 20px; color: #333333bf">
                                                    OrderId #${data.orderId} <br>
                                                    Order Amount: ₹${data.totalAmount}
                                                </p>

                                                <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; ">
                                                ${data?.product?.map((item, index) => `
                                                <div style="display: flex; flex-direction: row; justify-content: flex-start; ">
                                                    <div>
                                                        <img src=${item.image} alt="Logo" width="80" height="120">
                                                    </div>
                                                    <div style="margin-left: 20px;">
                                                        <p style="font-weight: 500; font-size: 15px; margin-top: 5px; margin-bottom:1px;">
                                                            Product :
                                                            <strong>${item.title}</strong>
                                                        </p>
                                                        <p style="font-weight: 500; font-size: 15px; margin-top: 0px; margin-bottom:0px;">
                                                            Qty :
                                                            <strong>${item.qty}</strong>
                                                        </p>

                                                    </div>
                                                </div>
                                                `).join('')}

                                            </td>
                                        </tr>

                                        <tr>
                                            <td>
                                                <p style="font-weight: 500; font-size: 15px;color: #333333bf;">
                                                    If you have any questions or need to reschedule, feel free to
                                                    reach out to us at:
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <p style="font-size: 15px">
                                                    <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                                    <span style="color: #333333bf;font-weight: 500"><a
                                                            href="tel:+917428648174">+917428648174</a></span>
                                                </p>
                                                <p style="font-size: 15px">
                                                    <span style=" color: #333333bf;font-weight: 600">Email:</span>
                                                    <span style="color: #333333bf;font-weight: 500"><a
                                                            href="mailto:care@sdpublication.com">care@sdpublication.com</a></span>
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <p style="font-weight: 500; font-size: 15px;color: #333333bf;">
                                                    <strong style="color: #333333bf;">Regards,</strong><br />
                                                    SD Publication Team
                                                </p>
                                            </td>
                                        </tr>
                                        <!----Footer Start-->
                                        <tr>
                                            <td style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
                                                <a href="https://www.facebook.com/sdstoreofficial" style="margin: 0 5px"><img
                                                        src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook"
                                                        style="width: 20px" /></a>
                                                <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09"
                                                    style="margin: 0 5px"><img src="https://static.sdcampus.com/assets/Twitter.png"
                                                        alt="Twitter" style="width: 20px" /></a>
                                                <a href="https://www.instagram.com/sdpublicationofficial/" style="margin: 0 5px"><img
                                                        src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram"
                                                        style="width: 20px" /></a>
                                                <a href="https://www.youtube.com/@sdpublication" style="margin: 0 5px"><img
                                                        src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube"
                                                        style="width: 20px" /></a>

                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                style="text-align: center; padding-top: 20px;color: #666; font-size: 12px; padding-bottom:10px;">
                                                Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                                                Uttar Pradesh 201005
                                            </td>
                                        </tr>
                                        <!----Footer End-->
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>

                    </html>
            `,
        };
        return result;
    },
    orderStatus: (to, name, data) => {
        let result = {
            from: `SD Publication <${process.env.email}>`,
            to,
            cc: ['care@sdpublication.com'],
            subject: `Your Order status`,
            html: `
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order2</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
                
            </head>
            
            <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
          <tr>
              <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                      <!-- Content -->
                      <tr>
                          <td style="padding: 0 20px 0">
                          <div> 
                             <p style="font-weight: 500; font-size: 15px;">Dear ${name},</p>
                             <p style="font-weight: 500; font-size: 15px;">Your Order has been <strong style="color : red;">${data.orderStatus}</strong></p>
                             <p style="font-weight: 500; font-size: 15px;">Order Id : <strong>${data.orderId}</strong> </p>
                           
                           </div>
                            
                              <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; ">
                              ${data?.product?.map((item, index) => `
                              <div style ="display: flex; flex-direction: row; justify-content: flex-start; ">
                                <div>
                                    <img src=${item.image} alt="Logo" width="80" height="120">
                                </div>
                                <div style="margin-left: 20px;">
                                    <p style="font-weight: 500; font-size: 15px; margin-top: 5px; margin-bottom:1px;">Product : <strong>${item.title}</strong> </p>
                                    <p style="font-weight: 500; font-size: 15px; margin-top: 0px; margin-bottom:0px;">Qty : <strong>${item.qty}</strong> </p>
                                    
                                </div>
                              </div>
                              `).join('')}
                              <p style="font-weight: 500; font-size: 15px;">Total Amount :  <span>&#8377; </span><strong>${data.totalAmount} </strong> </p>
                              <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; " >
                              <p style="font-weight: 500; font-size: 15px;">Any questions or concerns 
                                   <a href="care@sdpublication.com" style="color: blue;">care@sdpublication.com</a>
                               <p>
                                  <br>
                                  Thanks,
                                  <br>
                                SD Publication Team
                                  <br>
                                 +917428648174
                                  <br>
                                  <img src="https://static.sdcampus.com/assets/sdpublication-logo.png" alt="Logo" width="80">
                              </p>
                              <hr style="border: 1px solid #ccc;">
                          </td>
                      </tr>
                      <!-- Call to Action Button -->
                      <!-- Footer -->
                      <tr>
                          <td style="padding: 10px 20px; text-align: center;">
                              <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                              <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:care@sdpublication.com" style="color: blue;">care@sdpublication.com</a></p>
                              <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                              <p style="font-weight: 500; font-size: 15px;">+917428648174</p>
                              <hr style="border: 1px solid #ccc;">
                          </td>
                      </tr>
                      <!-- Social Icons -->
                      <tr>
                          <td align="center" style="padding: 10px 20px; ">
                          <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09"  style="margin: 10px;">
                              <img src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/twitter_icon.png"
                                  alt="Twitter" height="40" width="40"></a>
                          <a href="https://www.facebook.com/sdstoreofficial"  style="margin: 10px;"><img
                                  src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                  alt="Facebook" height="40" width="40"></a>
                          <a href="https://www.instagram.com/sdpublicationofficial/"  style="margin: 10px;"><img
                                  src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                  alt="Instagram" height="40" width="40"></a>
                          </td>
                      </tr>
                      <tr>
                          <td style="padding: 10px 20px; text-align: center;">
                              <p style="font-weight: 500; font-size: 10px;">
                              Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                              <br>Uttar Pradesh 201005</p>
                              <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD Publication</p>
                          </td>
                      </tr>
                      
                  </table>
              </td>
          </tr>
      </table>
  </body>
            
</html>
                  `,
        };
        return result;
    },
    orderDeliveryStatus: (to, name, data) => {
        let result = {
            from: `SD Store<${process.env.email}>`,
            to,
            cc: ['care@sdpublication.com'],
            subject: `Your Order status`,
            html: `
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order2</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
                
            </head>
            
            <body style="margin: 0; padding: 0; background-color: #f0e6ff; font-family: 'Noto Sans Devanagari', sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0e6ff;">
          <tr>
              <td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: white;">
                      <!-- Content -->
                      <tr>
                          <td style="padding: 0 20px 0">
                          <div> 
                            <p style="font-weight: 500; font-size: 15px;">Dear ${name},</p>
                            <p style="font-weight: 500; font-size: 15px;">Your Order has been <strong style="color : red;">${data.orderStatus}</strong></p>
                            <p style="font-weight: 500; font-size: 15px;">Order Id : <strong>${data.orderId}</strong> </p>
                             
                          </div>
                          
                              <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; ">
                              ${data?.product?.map((item, index) => `
                              <div style ="display: flex; flex-direction: row; justify-content: flex-start; ">
                                <div>
                                    <img src=${item.image} alt="Logo" width="80" height="120">
                                </div>
                                <div style="margin-left: 20px;">
                                    <p style="font-weight: 500; font-size: 15px; margin-top: 5px; margin-bottom:1px;">Product : <strong>${item.title}</strong> </p>
                                    <p style="font-weight: 500; font-size: 15px; margin-top: 0px; margin-bottom:0px;">Qty : <strong>${item.qty}</strong> </p>
                                    
                                </div>
                              </div>
                              `).join('')}
                              <p style="font-weight: 500; font-size: 15px;">Total Amount : <span>&#8377; </span> <strong>${data.totalAmount} </strong> </p>
                              <hr style="border-top: 1.5px dashed black; margin:10px 0px 5px; " >
                            
                               <p style="font-weight: 500; font-size: 15px;"> Order AWB Number :  ${data.awbNumber}.<p>
                               <p style="font-weight: 500; font-size: 15px;">Order Tracking Id  : ${data.trackingId}.<p>
                               <p style="font-weight: 500; font-size: 15px;">Order Tracking Link : ${data.trackingLink}.<p>
 
                              <p style="font-weight: 500; font-size: 15px;">Any questions or concerns 
                                   <a href="mailto:care@sdpublication.com" style="color: blue;">care@sdpublication.com</a>
                               <p>
                                  <br>
                                  Thanks,
                                  <br>
                                  SD Publication Team
                                  <br>
                                 +917428648174
                                  <br>
                                  <img src="https://static.sdcampus.com/assets/sdpublication-logo.png" alt="Logo" width="80">
                              </p>
                              <hr style="border: 1px solid #ccc;">
                          </td>
                      </tr>
                      <!-- Call to Action Button -->
                      <!-- Footer -->
                      <tr>
                          <td style="padding: 10px 20px; text-align: center;">
                              <p style="font-weight: 600; font-size: 18px;">For Any Information Please Email:</p>
                              <p style="font-weight: 500; font-size: 15px; color: blue;"><a href="mailto:care@sdpublication.com" style="color: blue;">care@sdpublication.com</a></p>
                              <p style="font-weight: 600; font-size: 18px;">कृपया कॉल करें:</p>
                              <p style="font-weight: 500; font-size: 15px;">+917428648174</p>
                              <hr style="border: 1px solid #ccc;">
                          </td>
                      </tr>
                      <!-- Social Icons -->
                      <tr>
                          <td align="center" style="padding: 10px 20px; ">
                          <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09"  style="margin: 10px;">
                              <img src="https://static.sdcampus.com/data/images/icons/twitter_icon.png"
                                  alt="Twitter" height="40" width="40"></a>
                          <a href="https://www.facebook.com/sdstoreofficial"  style="margin: 10px;"><img
                                  src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/fb_icon.png"
                                  alt="Facebook" height="40" width="40"></a>
                          <a href="https://www.instagram.com/sdpublicationofficial/"  style="margin: 10px;"><img
                                  src="https://storage-upschindi.s3.ap-south-1.amazonaws.com/data/images/icons/insta_icon.png"
                                  alt="Instagram" height="40" width="40"></a>
                          </td>
                      </tr>
                      <tr>
                          <td style="padding: 10px 20px; text-align: center;">
                              <p style="font-weight: 500; font-size: 10px;">
                              Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad, 
                              <br>Uttar Pradesh 201005</p>
                              <p style="font-size: 12px;">&copy;${new Date().getFullYear()} SD Publication</p>
                          </td>
                      </tr>
                      
                  </table>
              </td>
          </tr>
      </table>
  </body>
            
</html>
                  `,
        };
        return result;
    },
    BatchDoubtForTeacher: (to, name, data) => {
        let result = {
            from: `SD Empire<${process.env.email}>`,
            to,
            // cc: ['support@sdempire.co.in'],
            subject: `${data?.courseName} || Doubt Raised by ${data?.studentName} `,
            html: `
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doubt</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f0e6ff;
        font-family: "Noto Sans Devanagari", sans-serif;
      }
      table {
        border-spacing: 0;
        border-collapse: collapse;
      }
      img {
        display: block;
        max-width: 100%;
        height: auto;
      }
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          padding: 10px !important;
        }
        .content p {
          font-size: 14px !important;
        }
        .header p {
          font-size: 20px !important;
        }
      }
    </style>
  </head>
  <body>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background-color: #f0e6ff"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            class="container"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width: 600px; background-color: white"
          >
            <!-- Header -->
            <tr>
              <td style="padding: 20px; text-align: center">

              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 0 20px">
                <p
                  class="header"
                  style="
                    font-weight: 600;
                    font-size: 25px;
                    margin: 0 0 10px;
                    text-align: left;
                  "
                >
                  Dear ${name},
                </p>
                <p
                  class="content"
                  style="font-weight: 500; font-size: 15px; margin: 0"
                >
                  A new doubt has been raised by <strong>${data.studentName}</strong>
                  in <strong>${data.courseName}</strong>. Doubt details are as follows:
                </p>
                <table
                  style="
                    width: 100%;
                    margin: 15px 0;
                    border: 1px solid #ddd;
                    border-collapse: collapse;
                  "
                >
 
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px">
                      Doubt Raised By
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px">
                      ${data.studentName}
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px">
                      Batch Name
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px">
                      ${data.courseName}
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px">Lecture</td>
                    <td style="border: 1px solid #ddd; padding: 8px">${data.lectureName}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px">Subject</td>
                    <td style="border: 1px solid #ddd; padding: 8px">${data.subject}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px">Doubt</td>
                    <td style="border: 1px solid #ddd; padding: 8px">
                      ${data.doubtDesc}
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px">Doubt Image</td>
                    <td style="border: 1px solid #ddd; padding: 8px">
                      <img
                        src="${data.problemImage}"
                        alt="Problem Image"
                        width="100"
                      />
                    </td>
                  </tr>
                </table>
                <p class="content" style="margin: 0">
                  To resolve this doubt:
                  <br />
                  Go to the SD Campus App and navigate:
                  <br />
                  <strong>Home Page -> My Courses -> Doubt</strong>
                </p>
                <br />
                <p style="font-weight: 500; font-size: 15px; margin: 0">
                  Best regards,
                  <br />
                  The SD CAMPUS Team
                  <br />
                  7428394519
                     <br>
                                <img src="https://d1mbj426mo5twu.cloudfront.net/assets/sd+logo.png" alt="Logo" width="50">
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px; text-align: center">
                <p style="font-weight: 600; font-size: 18px">
                  For any information, please email:
                </p>
                <p style="font-weight: 500; font-size: 15px; color: blue">
                  <a href="mailto:support@sdempire.co.in" style="color: blue"
                    >support@sdempire.co.in</a
                  >
                </p>
                <p style="font-weight: 600; font-size: 18px">कृपया कॉल करें:</p>
                <p style="font-weight: 500; font-size: 15px">7428394520</p>
                <hr
                  style="
                    border: 1px solid #ccc;
                    margin: 10px 0;
                    width: 80%;
                  "
                />
              </td>
            </tr>
            <!-- Address -->
            <tr>
              <td style="padding: 10px; text-align: center">
                <p style="font-size: 10px">
                  Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,
                  <br />
                  Uttar Pradesh 201005
                </p>
                <p style="font-size: 12px">&copy;${new Date().getFullYear()} SD CAMPUS</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
                  `,
        };
        return result;
    },
    DemoSessionConfirmedImmediately: (to, name, data) => {
        let result = {
            from: `SD Campus<${process.env.email}>`,
            to,
            // cc: ['support@sdempire.co.in'],
            subject: `🎉 ${data.eventName} Confirmed – We're Excited! 🚀 `,
            html:
                `
            <!DOCTYPE html>
                <html lang="en">

                <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Demo Session Confirmed – We're Excited!</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 0;
                    background-color: #F2ECFF;
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    ">
                <table cellpadding="0" cellspacing="0" width="100%" style="
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                      <th style="background-color: #dbd3e1;">
                    &nbsp;
                    <img src="https://static.sdcampus.com/Banner/School_app_banner/Sainik_2_11zon_1742486759.jpg"
                        style="width:100%;border-radius: 5px;">
                    </th>
                    <tr>

                    <td style="padding: 0 20px 0px;border-radius: 8px;">

                        <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td>
                            <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                Hi ${name},
                            </p>
                            <span style="font-weight: 500; font-size: 16px; color: #333333bf">
                             Thank you for booking a demo session with us! We're thrilled to show our best teaching methods to help your child to crack the JNV/Sainik Entrance for classes 6 & 9.
                            </span>
                            <p style="font-weight: 500; font-size: 14px; color: #333333bf">
                                <span style="font-weight: 700">📅 Date and Time:</span> 
                                ${data.date}, ${data.startTime} - ${data.endTime}
                            </p>
                            <p style="font-weight: 500; font-size: 14px; color: #333333bf">
                                <span style="font-weight: 700">💻 Platform:</span>
                                <a href="${data.meetLink}"
                                style="color: #1e96c8; text-decoration: none">${data.meetLink}</a>
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding-bottom: 20px; color: #333333bf">
                            Please make sure to attend the session on time.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px; color: #333333bf">
                            <p style="font-weight: 500; font-size: 16px">
                                If you're interested in joining our
                                <strong>Sainik & JNV Entrance Exam Foundation</strong> Batch
                                please Enroll by clicking on the following links:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px">
                           <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                <td style="padding: 5px 0;font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes" style="
                                        color: #1e96c8;
                                        text-decoration: none;
                                        padding: 0px 0px 0px 14px;
                                        ">Sainik School 2025-26 Complete Live Foundation Batch for Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 9: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes" style="
                                        color: #1e96c8;
                                        text-decoration: none;
                                        padding: 0px 0px 0px 14px;
                                        ">Sainik School 2025-26 Complete Live Foundation Batch for Class 9th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: JNV School Entrance Exam</strong> - 1
                                    Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes" style="
                                        color: #1e96c8;
                                        text-decoration: none;
                                        padding: 0px 0px 0px 14px;
                                        ">JNV 2025-26 Complete Live Foundation Batch for Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    »
                                    <span style="font-weight: 600">Class 9: JNV School Entrance Exam</span>
                                    <span style="font-weight: 500">
                                    - 1 Year Foundation Batch: </span><br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes" style="
                                        color: #1e96c8;
                                        text-decoration: none;
                                        padding: 0px 0px 0px 14px;
                                        ">JNV 2025-26 Complete Live Foundation Batch for Class 9th</a>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px;color: #333333bf;">
                                If you have any questions or need to reschedule, feel free to
                                reach out to us at:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                <span style="color: #333333bf;font-weight: 500"><a href="+917428394519">+917428394519</a></span>
                            </p>
                            <p style="font-size: 15px">
                                <span style=" color: #333333bf;font-weight: 600">Email:</span>
                                <span style="color: #333333bf;font-weight: 500">support@sdempire.co.in</span>
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px;color: #333333bf;">
                                <strong style="color: #333333bf;">Thanks,</strong><br />
                                SD Campus
                            </p>
                            </td>
                        </tr>
                        <!----Footer Start-->
                        <tr>
                            <td style="padding: 2px 0; color: #333333bf">
                            Download SD Campus App:<br />
                            <a href="https://play.google.com/store/apps/details?id=com.sdcampus.app" style="display: inline-block; margin-left: -10px">
                                <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                alt="Get it on Google Play" style="max-width: 150px" />
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                ">
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook" style="width: 20px" /></a>
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/Twitter.png" alt="Twitter" style="width: 20px" /></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram" style="width: 20px" /></a>
                            <a href="https://www.youtube.com/@sdcampusofficial" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube" style="width: 20px" /></a>
                            <a href="https://t.me/sd_campus" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/Telegram.png" alt="Telegram" style="width: 20px" /></a>

                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                color: #666;
                                font-size: 12px;
                                ">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                            Uttar Pradesh 201005
                            </td>
                        </tr>
                        <!----Footer End-->
                        </table>
                    </td>
                    </tr>
                </table>
                </body>

                </html>

            `,
        };
        return result;
    },
    DemoReminder1HrsBefore: (to, name, data) => {
        let result = {
            from: `SD Campus<${process.env.email}>`,
            to,
            // cc: ['support@sdempire.co.in'],
            subject: `🎈 Reminder: ${data.eventName} at ${data.startTime} Today`,
            html: `
            <!DOCTYPE html>
                <html lang="en">

                <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>🎈 Reminder: SD campus Demo class at 5:00 pm today</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 0;
                    background-color: #f0e6ff;
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    ">
                <table cellpadding="0" cellspacing="0" width="100%" style="
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                    <th style="background-color: #dbd3e1;">
                    &nbsp;
                    <img src="https://static.sdcampus.com/Banner/School_app_banner/Sainik_2_11zon_1742486759.jpg"
                        style="width:100%;border-radius: 5px;">
                    </th>
                    <tr>
                    <td style="padding: 0 20px 0px">
                        <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td>
                            <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                Hi ${name},
                            </p>
                            <span style="font-weight: 500; font-size: 16px; color: #333333bf">
                                Your <strong>${data.eventName}</strong> is at <strong>${data.startTime}</strong> today starts in one
                                hour. Please join on time by clicking on the link below.
                            </span>

                            <p style="font-weight: 500; font-size: 14px; color: #333333bf">
                                <span style="font-weight: 700">Meeting Link:</span>
                                <a href="${data.meetLink}" style="color: #1e96c8; text-decoration: none">${data.meetLink}</a>
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #333333bf">
                            <p style="font-weight: 500; font-size: 16px">
                                If you're interested in joining our <strong>Foundation Batch for
                                Sainik/JNV Entrance</strong>, here are the enrollment links:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                <td style="padding: 5px 0;font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style=" color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26 Complete Live Foundation
                                    Batch for Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 9: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26 Complete Live Foundation
                                    Batch for Class 9th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: JNV School Entrance Exam</strong> - 1
                                    Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px; ">JNV 2025-26 Complete Live Foundation Batch for
                                    Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    »
                                    <span style="font-weight: 600">Class 9: JNV School Entrance Exam</span>
                                    <span style="font-weight: 500">
                                    - 1 Year Foundation Batch: </span><br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none; padding: 0px 0px 0px 14px;">JNV 2025-26 Complete Live Foundation Batch for
                                    Class 9th</a>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                If you have any questions or need to reschedule, feel free to
                                reach out to us at:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                <span style="color: #333333bf; font-weight: 500"><a href="+917428394519">+917428394519</a></span>
                            </p>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Email:</span>
                                <span style="color: #333333bf; font-weight: 500">support@sdempire.co.in</span>
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                <strong style="color: #333333bf">Thanks,</strong><br />
                                SD Campus
                            </p>
                            </td>
                        </tr>
                        <!----Footer Start-->
                        <tr>
                            <td style="padding: 2px 0; color: #333333bf">
                            Download SD Campus App:<br />
                             <a href="https://play.google.com/store/apps/details?id=com.sdcampus.app" style="display: inline-block; margin-left: -10px">
                                <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                alt="Get it on Google Play" style="max-width: 150px" />
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                ">
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook" style="width: 20px" /></a>
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/Twitter.png" alt="Twitter" style="width: 20px" /></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram" style="width: 20px" /></a>
                            <a href="https://www.youtube.com/@sdcampusofficial" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube" style="width: 20px" /></a>
                            <!-- <a
                                    href="https://t.me/sd_campus"
                                    style="margin: 0 5px"
                                    ><img
                                    src="https://static.sdcampus.com/assets/Telegram.png"
                                    alt="Telegram"
                                    style="width: 20px"
                                /></a> -->
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                color: #666;
                                font-size: 12px;
                                ">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                            Uttar Pradesh 201005
                            </td>
                        </tr>
                        <!----Footer End-->
                        </table>
                    </td>
                    </tr>
                </table>
                </body>

                </html>
            `,
        };
        return result;
    },
    DemoReminder15MinsBefore: (to, name, data) => {
        let result = {
            from: `SD Campus<${process.env.email}>`,
            to,
            // cc: ['support@sdempire.co.in'],
            subject: `🎈 Reminder: ${data.eventName} at ${data.startTime} Today`,
            html: `
            <!DOCTYPE html>
                <html lang="en">

                <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>🎈 Reminder: SD campus Demo class at 5:00 pm today</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 0;
                    background-color: #f0e6ff;
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    ">
                <table cellpadding="0" cellspacing="0" width="100%" style="
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                    <th style="background-color: #dbd3e1;">
                    &nbsp;
                    <img src="https://static.sdcampus.com/Banner/School_app_banner/Sainik_2_11zon_1742486759.jpg"
                        style="width:100%;border-radius: 5px;">
                    </th>
                    <tr>
                    <td style="padding: 0 20px 0px">
                        <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td>
                            <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                Hi ${name},
                            </p>
                            <span style="font-weight: 500; font-size: 16px; color: #333333bf">
                                Your <strong>${data.eventName}</strong> is at <strong>${data.startTime}</strong> today starts in 15
                                Min. Please join on time by clicking on the link below.
                            </span>

                            <p style="font-weight: 500; font-size: 14px; color: #333333bf">
                                <span style="font-weight: 700">Meeting Link:</span>
                                <a href="${data.meetLink}" style="color: #1e96c8; text-decoration: none">${data.meetLink}</a>
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #333333bf">
                            <p style="font-weight: 500; font-size: 16px">
                                If you're interested in joining our <strong>Foundation Batch for
                                Sainik/JNV Entrance</strong>, here are the enrollment links:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                <td style="padding: 5px 0;font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style=" color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26 Complete Live Foundation
                                    Batch for Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 9: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26 Complete Live Foundation
                                    Batch for Class 9th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: JNV School Entrance Exam</strong> - 1
                                    Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px; ">JNV 2025-26 Complete Live Foundation Batch for
                                    Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    »
                                    <span style="font-weight: 600">Class 9: JNV School Entrance Exam</span>
                                    <span style="font-weight: 500">
                                    - 1 Year Foundation Batch: </span><br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none; padding: 0px 0px 0px 14px;">JNV 2025-26 Complete Live Foundation Batch for
                                    Class 9th</a>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                If you have any questions or need to reschedule, feel free to
                                reach out to us at:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                <span style="color: #333333bf; font-weight: 500"><a href="+917428394519">+917428394519</a></span>
                            </p>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Email:</span>
                                <span style="color: #333333bf; font-weight: 500">support@sdempire.co.in</span>
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                <strong style="color: #333333bf">Thanks,</strong><br />
                                SD Campus
                            </p>
                            </td>
                        </tr>
                        <!----Footer Start-->
                        <tr>
                            <td style="padding: 2px 0; color: #333333bf">
                            Download SD Campus App:<br />
                             <a href="https://play.google.com/store/apps/details?id=com.sdcampus.app" style="display: inline-block; margin-left: -10px">
                                <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                alt="Get it on Google Play" style="max-width: 150px" />
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                ">
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook" style="width: 20px" /></a>
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/Twitter.png" alt="Twitter" style="width: 20px" /></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram" style="width: 20px" /></a>
                            <a href="https://www.youtube.com/@sdcampusofficial" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube" style="width: 20px" /></a>
                            <!-- <a
                                    href="https://t.me/sd_campus"
                                    style="margin: 0 5px"
                                    ><img
                                    src="https://static.sdcampus.com/assets/Telegram.png"
                                    alt="Telegram"
                                    style="width: 20px"
                                /></a> -->
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                color: #666;
                                font-size: 12px;
                                ">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                            Uttar Pradesh 201005
                            </td>
                        </tr>
                        <!----Footer End-->
                        </table>
                    </td>
                    </tr>
                </table>
                </body>

                </html>
            `,
        };
        return result;
    },
    DemoReminder5MinsBefore: (to, name, data) => {
        let result = {
            from: `SD Campus<${process.env.email}>`,
            to,
            // cc: ['support@sdempire.co.in'],
            subject: `🎈 Reminder: ${data.eventName} at ${data.startTime} Today`,
            html: `
            <!DOCTYPE html>
                <html lang="en">

                <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>🎈 Reminder: SD campus Demo class at 5:00 pm today</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 0;
                    background-color: #f0e6ff;
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    ">
                <table cellpadding="0" cellspacing="0" width="100%" style="
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                    <th style="background-color: #dbd3e1;">
                    &nbsp;
                    <img src="https://static.sdcampus.com/Banner/School_app_banner/Sainik_2_11zon_1742486759.jpg"
                        style="width:100%;border-radius: 5px;">
                    </th>
                    <tr>
                    <td style="padding: 0 20px 0px">
                        <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td>
                            <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                Hi ${name},
                            </p>
                            <span style="font-weight: 500; font-size: 16px; color: #333333bf">
                                Your <strong>${data.eventName}</strong> is at <strong>${data.startTime}</strong> today starts in 5
                                Min. Please join on time by clicking on the link below.
                            </span>

                            <p style="font-weight: 500; font-size: 14px; color: #333333bf">
                                <span style="font-weight: 700">Meeting Link:</span>
                                <a href="${data.meetLink}" style="color: #1e96c8; text-decoration: none">${data.meetLink}</a>
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #333333bf">
                            <p style="font-weight: 500; font-size: 16px">
                                If you're interested in joining our <strong>Foundation Batch for
                                Sainik/JNV Entrance</strong>, here are the enrollment links:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                <td style="padding: 5px 0;font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style=" color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26 Complete Live Foundation
                                    Batch for Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 9: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26 Complete Live Foundation
                                    Batch for Class 9th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: JNV School Entrance Exam</strong> - 1
                                    Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px; ">JNV 2025-26 Complete Live Foundation Batch for
                                    Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    »
                                    <span style="font-weight: 600">Class 9: JNV School Entrance Exam</span>
                                    <span style="font-weight: 500">
                                    - 1 Year Foundation Batch: </span><br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none; padding: 0px 0px 0px 14px;">JNV 2025-26 Complete Live Foundation Batch for
                                    Class 9th</a>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                If you have any questions or need to reschedule, feel free to
                                reach out to us at:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                <span style="color: #333333bf; font-weight: 500"><a href="+917428394519">+917428394519</a></span>
                            </p>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Email:</span>
                                <span style="color: #333333bf; font-weight: 500">support@sdempire.co.in</span>
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                <strong style="color: #333333bf">Thanks,</strong><br />
                                SD Campus
                            </p>
                            </td>
                        </tr>
                        <!----Footer Start-->
                        <tr>
                            <td style="padding: 2px 0; color: #333333bf">
                            Download SD Campus App:<br />
                            <a href="https://play.google.com/store/apps/details?id=com.sdcampus.app" style="display: inline-block; margin-left: -10px">
                                <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                alt="Get it on Google Play" style="max-width: 150px" />
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                ">
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook" style="width: 20px" /></a>
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/Twitter.png" alt="Twitter" style="width: 20px" /></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram" style="width: 20px" /></a>
                            <a href="https://www.youtube.com/@sdcampusofficial" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube" style="width: 20px" /></a>
                            <!-- <a
                                    href="https://t.me/sd_campus"
                                    style="margin: 0 5px"
                                    ><img
                                    src="https://static.sdcampus.com/assets/Telegram.png"
                                    alt="Telegram"
                                    style="width: 20px"
                                /></a> -->
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                color: #666;
                                font-size: 12px;
                                ">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                            Uttar Pradesh 201005
                            </td>
                        </tr>
                        <!----Footer End-->
                        </table>
                    </td>
                    </tr>
                </table>
                </body>

                </html>
            `,
        };
        return result;
    },
    DemoFollowUpAfter2Mins: (to, name, data) => {
        let result = {
            from: `SD Campus<${process.env.email}>`,
            to,
            cc: ['support@sdempire.co.in'],
            subject: `Liked the demo? 😍 Enroll now and take the next step! 🚀📚`,
            html: `
            <!DOCTYPE html>
                <html lang="en">

                <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Liked the demo? 😍 Enroll now and take the next step! 🚀📚</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 0;
                    background-color: #f0e6ff;
                    font-family: 'Noto Sans Devanagari', sans-serif;
                    ">
                <table cellpadding="0" cellspacing="0" width="100%" style="
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    ">
                    <th style="background-color: #dbd3e1;">
                    &nbsp;
                    <img src="https://static.sdcampus.com/Banner/School_app_banner/Sainik_2_11zon_1742486759.jpg"
                        style="width:100%;border-radius: 5px;">
                    </th>
                    <tr>
                    <td style="padding: 0 20px 0px">
                        <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td>
                            <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                Hi <strong>${name}</strong>,
                            </p>
                            <span style="font-weight: 500; font-size: 16px; color: #333333bf">
                                Thank you for attending the demo session for Sainik/JNV
                                Entrance exam.
                            </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #333333bf">
                            <p style="font-weight: 500; font-size: 16px">
                                Click the below link to join our Foundation Batch for
                                Sainik/JNV Entrance, here are the enrollment links:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                <td style="padding: 5px 0;font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style=" color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26
                                    Complete Live
                                    Foundation
                                    Batch for Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 9: Sainik School Entrance Exam</strong> -
                                    1 Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26
                                    Complete Live
                                    Foundation
                                    Batch for Class 9th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    » <strong>Class 6: JNV School Entrance Exam</strong> - 1
                                    Year Foundation Batch:<br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px; ">JNV 2025-26 Complete Live
                                    Foundation
                                    Batch for
                                    Class 6th</a>
                                </td>
                                </tr>
                                <tr>
                                <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                    »
                                    <span style="font-weight: 600">Class 9: JNV School Entrance Exam</span>
                                    <span style="font-weight: 500">
                                    - 1 Year Foundation Batch: </span><br />
                                    <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                    style="color: #1e96c8;text-decoration: none; padding: 0px 0px 0px 14px;">JNV 2025-26 Complete Live
                                    Foundation
                                    Batch for
                                    Class 9th</a>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                If you have any questions or need to reschedule, feel free to
                                reach out to us at:
                            </p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                <span style="color: #333333bf; font-weight: 500"><a href="+917428394519">+917428394519</a></span>
                            </p>
                            <p style="font-size: 15px">
                                <span style="color: #333333bf; font-weight: 600">Email:</span>
                                <span style="color: #333333bf; font-weight: 500"><a
                                    href="mailto:info@sdcampro.co.in">support@sdempire.co.in</a></span>
                            </p>
                            </td>
                        </tr>

                        <tr>
                            <td>
                            <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                <strong style="color: #333333bf">Thanks,</strong><br />
                                SD Campus
                            </p>
                            </td>
                        </tr>
                        <!----Footer Start-->
                        <tr>
                            <td style="padding: 2px 0; color: #333333bf">
                            Download SD Campus App:<br />
                            <a href="https://play.google.com/store/apps/details?id=com.sdcampus.app"
                                style="display: inline-block; margin-left: -10px">
                                <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                alt="Get it on Google Play" style="max-width: 150px" />
                            </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                ">
                            <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook" style="width: 20px" /></a>
                            <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/Twitter.png" alt="Twitter" style="width: 20px" /></a>
                            <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram" style="width: 20px" /></a>
                            <a href="https://www.youtube.com/@sdcampusofficial" style="margin: 0 5px"><img
                                src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube" style="width: 20px" /></a>
                            <!-- <a
                                href="https://t.me/sd_campus"
                                style="margin: 0 5px"
                                ><img
                                src="https://static.sdcampus.com/assets/Telegram.png"
                                alt="Telegram"
                                style="width: 20px"
                            /></a> -->
                            </td>
                        </tr>
                        <tr>
                            <td style="
                                text-align: center;
                                padding-top: 20px;
                                color: #666;
                                font-size: 12px;
                                ">
                            Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                            Uttar Pradesh 201005
                            </td>
                        </tr>
                        <!----Footer End-->
                        </table>
                    </td>
                    </tr>
                </table>
                </body>

                </html>
            
            `,
        };
        return result;
    },
    DemoFollowUpAfter24Hrs: (to, name, data) => {
        let result = {
            from: `SD Campus<${process.env.email}>`,
            to,
            cc: ['support@sdempire.co.in'],
            subject: `Last chance! ⏳ Grab the limited seats before they’re gone! 🎯🔥`,
            html: `
            <!DOCTYPE html>
                    <html lang="en">

                    <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>
                        Last chance! ⏳ Grab the limited seats before they’re gone! 🎯🔥
                    </title>
                    </head>

                    <body style="
                        margin: 0;
                        padding: 0;
                        background-color: #f0e6ff;
                        font-family: 'Noto Sans Devanagari', sans-serif;
                        ">
                    <table cellpadding="0" cellspacing="0" width="100%" style="
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: white;
                            border-radius: 15px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        ">
                        <th style="background-color: #dbd3e1;">
                        &nbsp;
                        <img src="https://static.sdcampus.com/Banner/School_app_banner/Sainik_2_11zon_1742486759.jpg"
                            style="width:100%;border-radius: 5px;">
                        </th>
                        <tr>
                        <td style="padding: 0 20px 0px">
                            <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td>
                                <p style="font-weight: 700; font-size: 20px; color: #333333bf">
                                    Hi <strong>${name}</strong>,
                                </p>
                                <span style="font-weight: 500; font-size: 16px; color: #333333bf">
                                    Hurry up to join our expert Sainik/JNV Entrance exam. Key
                                    features:
                                </span>

                                <ul style="color: #333333bf">
                                    <li style="margin-bottom: 8px">Best teachers</li>
                                    <li style="margin-bottom: 8px">
                                    Specific class notes and PDF
                                    </li>
                                    <li style="margin-bottom: 8px">Books and other resources</li>
                                    <li style="margin-bottom: 8px">Recorded and live classes</li>
                                    <li style="margin-bottom: 8px">
                                    Live mentoring and doubt clearing sessions
                                    </li>
                                </ul>
                                </td>
                            </tr>
                            <tr>
                                <td style="color: #333333bf">
                                <p style="font-weight: 500; font-size: 16px">
                                    Click the below link to join our Foundation Batch for
                                    Sainik/JNV Entrance, here are the enrollment links:
                                </p>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                    <td style="padding: 5px 0;font-size: 14px;color: #333333bf;">
                                        » <strong>Class 6: Sainik School Entrance Exam</strong> -
                                        1 Year Foundation Batch:<br />
                                        <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                        style=" color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26
                                        Complete Live
                                        Foundation
                                        Batch for Class 6th</a>
                                    </td>
                                    </tr>
                                    <tr>
                                    <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                        » <strong>Class 9: Sainik School Entrance Exam</strong> -
                                        1 Year Foundation Batch:<br />
                                        <a href="https://www.sdcampus.com/school-entrance-exams/sainik-school-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                        style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px;">Sainik School 2025-26
                                        Complete Live
                                        Foundation
                                        Batch for Class 9th</a>
                                    </td>
                                    </tr>
                                    <tr>
                                    <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                        » <strong>Class 6: JNV School Entrance Exam</strong> - 1
                                        Year Foundation Batch:<br />
                                        <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-6th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                        style="color: #1e96c8;text-decoration: none;padding: 0px 0px 0px 14px; ">JNV 2025-26 Complete Live
                                        Foundation
                                        Batch for
                                        Class 6th</a>
                                    </td>
                                    </tr>
                                    <tr>
                                    <td style="padding: 5px 0; font-size: 14px;color: #333333bf;">
                                        »
                                        <span style="font-weight: 600">Class 9: JNV School Entrance Exam</span>
                                        <span style="font-weight: 500">
                                        - 1 Year Foundation Batch: </span><br />
                                        <a href="https://www.sdcampus.com/school-entrance-exams/jnv-2025-26-complete-live-foundation-batch-for-class-9th?utm_source=Automated+Emails&utm_medium=Email&utm_campaign=Sainik+JNV+Demo+Classes"
                                        style="color: #1e96c8;text-decoration: none; padding: 0px 0px 0px 14px;">JNV 2025-26 Complete Live
                                        Foundation
                                        Batch for
                                        Class 9th</a>
                                    </td>
                                    </tr>
                                </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                    If you have any questions or need to reschedule, feel free to
                                    reach out to us at:
                                </p>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                <p style="font-size: 15px">
                                    <span style="color: #333333bf; font-weight: 600">Phone:</span>
                                    <span style="color: #333333bf; font-weight: 500"><a href="+917428394519">+917428394519</a></span>
                                </p>
                                <p style="font-size: 15px">
                                    <span style="color: #333333bf; font-weight: 600">Email:</span>
                                    <span style="color: #333333bf; font-weight: 500"><a
                                        href="mailto:info@sdcampro.co.in">support@sdempire.co.in</a></span>
                                </p>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                <p style="font-weight: 500; font-size: 15px; color: #333333bf">
                                    <strong style="color: #333333bf">Thanks,</strong><br />
                                    SD Campus
                                </p>
                                </td>
                            </tr>
                            <!----Footer Start-->
                            <tr>
                                <td style="padding: 2px 0; color: #333333bf">
                                Download SD Campus App:<br />
                                <a href="https://play.google.com/store/apps/details?id=com.sdcampus.app"
                                    style="display: inline-block; margin-left: -10px">
                                    <img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
                                    alt="Get it on Google Play" style="max-width: 150px" />
                                </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="
                                    text-align: center;
                                    padding-top: 20px;
                                    border-top: 1px solid #eee;
                                    ">
                                <a href="https://www.facebook.com/sdcampus1?mibextid=b06tZ0" style="margin: 0 5px"><img
                                    src="https://static.sdcampus.com/assets/facebook.png" alt="Facebook" style="width: 20px" /></a>
                                <a href="https://twitter.com/SdCampus?t=954CVu6lwAprPboG5ca6dw&s=09" style="margin: 0 5px"><img
                                    src="https://static.sdcampus.com/assets/Twitter.png" alt="Twitter" style="width: 20px" /></a>
                                <a href="https://www.instagram.com/sd_campus/?igshid=MzRlODBiNWFlZA%3D%3D" style="margin: 0 5px"><img
                                    src="https://static.sdcampus.com/assets/instagram.png" alt="Instagram" style="width: 20px" /></a>
                                <a href="https://www.youtube.com/@sdcampusofficial" style="margin: 0 5px"><img
                                    src="https://static.sdcampus.com/assets/YouTube.png" alt="YouTube" style="width: 20px" /></a>
                                <!-- <a
                                    href="https://t.me/sd_campus"
                                    style="margin: 0 5px"
                                    ><img
                                        src="https://static.sdcampus.com/assets/Telegram.png"
                                        alt="Telegram"
                                        style="width: 20px"
                                    /></a> -->
                                </td>
                            </tr>
                            <tr>
                                <td style="
                                    text-align: center;
                                    padding-top: 20px;
                                    color: #666;
                                    font-size: 12px;
                                    ">
                                Plot No-16, Block 7, Sector 5, Rajendra Nagar, Ghaziabad,<br />
                                Uttar Pradesh 201005
                                </td>
                            </tr>
                            <!----Footer End-->
                            </table>
                        </td>
                        </tr>
                    </table>
                    </body>
                    </html>
            
            `,
        };
        return result;
    },
};
