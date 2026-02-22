import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    try {
        // Instantiate Resend inside the handler to avoid build-time errors
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey || apiKey === 're_your_api_key_here') {
            console.error('Missing or invalid RESEND_API_KEY');
            return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
        }
        const resend = new Resend(apiKey);

        const { submissionId } = await req.json();

        if (!submissionId) {
            return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
        }

        // Fetch submission details from Supabase
        const { data: intakeData, error: intakeError } = await supabase
            .from('intake_forms')
            .select('*')
            .eq('submission_id', submissionId)
            .single();

        if (intakeError || !intakeData) {
            console.error('Error fetching intake data:', intakeError);
            return NextResponse.json({ error: 'Failed to fetch submission data' }, { status: 500 });
        }

        // Fetch questionnaire answers
        const { data: qData, error: qError } = await supabase
            .from('vehicle_questionnaire')
            .select('question_text, selected_answer')
            .eq('submission_id', submissionId);

        if (qError) {
            console.error('Error fetching questionnaire data:', qError);
            // We'll continue without qData if needed, but it's better to have it
        }

        const { first_name, last_name, phone_number, vehicle_year, make, model, current_mileage, comments } = intakeData;
        const adminEmails = ['aaron@imxauto.com', 'aureen@imxauto.com'];

        // Construct the email body
        const emailHtml = `
      <h1>New Vehicle Intake Submission</h1>
      <p><strong>Customer:</strong> ${first_name} ${last_name}</p>
      <p><strong>Phone:</strong> ${phone_number}</p>
      <p><strong>Vehicle:</strong> ${vehicle_year} ${make} ${model}</p>
      <p><strong>Mileage:</strong> ${current_mileage || 'N/A'}</p>
      <p><strong>Comments:</strong> ${comments || 'None'}</p>
      
      <h3>Questionnaire Responses:</h3>
      <ul>
        ${qData?.map(q => `<li><strong>${q.question_text}</strong>: ${q.selected_answer}</li>`).join('') || '<li>No questionnaire data found</li>'}
      </ul>
      
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin">View in Admin Panel</a></p>
    `;

        // Send the email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'IMX Auto Group <notifications@imxauto.com>',
            to: adminEmails,
            subject: `New Submission: ${first_name} ${last_name} - ${vehicle_year} ${make} ${model}`,
            html: emailHtml,
        });

        if (emailError) {
            console.error('Error sending email:', emailError);
            return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Notification sent successfully', id: emailData?.id });
    } catch (err: any) {
        console.error('Unexpected error in notify route:', err);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
