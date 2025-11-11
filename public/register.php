<?php
header('Content-Type: application/json');

// Handle CORS if needed (optional for same-origin)
// header("Access-Control-Allow-Origin: *");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php'; // Adjust path if needed

// Get POST data
$first_name = $_POST['name'] ?? '';
$last_name  = $_POST['surname'] ?? '';
$email      = $_POST['email'] ?? '';
$phone      = $_POST['phone'] ?? '';
$company    = $_POST['company'] ?? '';
$position   = $_POST['position'] ?? '';

// Basic validation
if (empty($first_name) || empty($last_name) || empty($email) || empty($phone) || empty($company) || empty($position)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

// TODO: Add database insertion here (e.g., save to MySQL)

// --- Send email using PHPMailer ---
$mail = new PHPMailer(true);

try {
    // SMTP Configuration (example using Gmail)
    // Replace with your own SMTP settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';       // Set the SMTP server
    $mail->SMTPAuth   = true;
    $mail->Username   = 'your-email@gmail.com'; // Your Gmail address
    $mail->Password   = 'your-app-password';    // Use App Password (not regular password!)
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // Sender and recipient
    $mail->setFrom('your-email@gmail.com', 'Marytechenock Solutions');
    $mail->addAddress('info@marytechenock.com', $first_name . ' ' . $last_name);

    // Email content
    $mail->isHTML(true);
    $mail->Subject = 'Registration Confirmation';
    $mail->Body    = "
        <h2>Thank you for registering!</h2>
        <p>Dear <strong>{$first_name} {$last_name}</strong>,</p>
        <p>Your registration has been received successfully.</p>
        <ul>
            <li><strong>Company:</strong> {$company}</li>
            <li><strong>Position:</strong> {$position}</li>
            <li><strong>Email:</strong> {$email}</li>
            <li><strong>Phone:</strong> {$phone}</li>
        </ul>
        <p>We’ll contact you soon with further details.</p>
        <p>Best regards,<br>Your Event Team</p>
    ";

    $mail->send();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    error_log("Email error: " . $mail->ErrorInfo); // Log for debugging
    echo json_encode(['success' => false, 'message' => 'Failed to send confirmation email.']);
}
?>