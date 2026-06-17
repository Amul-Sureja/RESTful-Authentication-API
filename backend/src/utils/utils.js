function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpHtmlEmail(otp) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" border="0"
                        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

                        <!-- Header -->
                        <tr>
                            <td align="center"
                                style="background:#2563eb;padding:30px;color:#ffffff;">
                                <h1 style="margin:0;font-size:28px;">Verify Your Account</h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td style="padding:40px 30px;color:#333333;">
                                <h2 style="margin-top:0;">Your One-Time Password (OTP)</h2>

                                <p style="font-size:16px;line-height:1.6;">
                                    Use the following OTP to complete your verification process:
                                </p>

                                <div style="text-align:center;margin:30px 0;">
                                    <span style="
                                        display:inline-block;
                                        background:#f3f4f6;
                                        border:2px dashed #2563eb;
                                        padding:15px 35px;
                                        font-size:32px;
                                        font-weight:bold;
                                        letter-spacing:8px;
                                        color:#2563eb;
                                        border-radius:10px;">
                                        ${otp}
                                    </span>
                                </div>

                                <p style="font-size:15px;line-height:1.6;">
                                    This OTP is valid for <strong>10 minutes</strong>.
                                </p>

                                <p style="font-size:15px;line-height:1.6;color:#dc2626;">
                                    Do not share this code with anyone.
                                </p>

                                <p style="font-size:15px;line-height:1.6;">
                                    If you did not request this verification, please ignore this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center"
                                style="background:#f9fafb;padding:20px;color:#6b7280;font-size:13px;">
                                © ${new Date().getFullYear()} Your Company. All rights reserved.
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

export { generateOtp, getOtpHtmlEmail };