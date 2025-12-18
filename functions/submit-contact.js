export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      homeType: formData.get('homeType'),
      message: formData.get('message'),
      timestamp: new Date().toISOString()
    };

    // Email notification setup
    const emailBody = `
New Contact Form Submission from EcoPower Solutions Website

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Property Address: ${data.address || 'Not provided'}
Home Type: ${data.homeType || 'Not specified'}

Message:
${data.message}

Submitted: ${data.timestamp}
    `.trim();

    // Send email using Cloudflare Email Workers (if configured)
    // For now, we'll return success and you can integrate with your email service
    
    // You can integrate with services like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - or store in Cloudflare KV/D1 database

    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your submission! We will contact you within 1-2 business days.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'There was an error submitting your form. Please try calling us directly at 443-212-8401.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
