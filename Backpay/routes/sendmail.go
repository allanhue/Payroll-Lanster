package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"strings"
)

type sendMailRequest struct {
	OrgID   string `json:"orgId"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

type supportRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

// getMailConfig returns Brevo SMTP configuration from environment
func getMailConfig() (host string, port string, from string, password string, supportTo string) {
	host = os.Getenv("MAIL_SERVER")
	if host == "" {
		host = "smtp-relay.brevo.com"
	}
	port = os.Getenv("MAIL_PORT")
	if port == "" {
		port = "587"
	}
	from = os.Getenv("MAIL_FROM")
	if from == "" {
		from = "centralhype9@gmail.com"
	}
	password = os.Getenv("BREVO_API_KEY")
	supportTo = os.Getenv("SUPPORT_MAIL_TO")
	if supportTo == "" {
		supportTo = "centralhype9@gmail.com"
	}
	return
}

// sendEmail sends email via Brevo SMTP
func sendEmail(to []string, subject, body string) error {
	host, port, from, password, _ := getMailConfig()

	if password == "" {
		return fmt.Errorf("BREVO_API_KEY not configured")
	}

	// Format email
	fromName := os.Getenv("MAIL_FROM_NAME")
	if fromName == "" {
		fromName = "PulseForge"
	}

	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", fromName, from)
	headers["To"] = strings.Join(to, ", ")
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var msg bytes.Buffer
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(body)

	// Send via SMTP
	auth := smtp.PlainAuth("", from, password, host)
	addr := fmt.Sprintf("%s:%s", host, port)

	return smtp.SendMail(addr, auth, from, to, msg.Bytes())
}

func (a *App) sendMailTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req sendMailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.OrgID == "" || req.Subject == "" || req.Body == "" {
		writeError(w, http.StatusBadRequest, "orgId, subject and body are required")
		return
	}

	_, _, _, _, supportTo := getMailConfig()

	htmlBody := fmt.Sprintf(`
    <h2>Test Email from Payroll System</h2>
    <p><strong>Organization:</strong> %s</p>
    <p><strong>Subject:</strong> %s</p>
    <hr>
    <p>%s</p>
  `, req.OrgID, req.Subject, req.Body)

	if err := sendEmail([]string{supportTo}, req.Subject, htmlBody); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to send email: %v", err))
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"sent":    true,
		"message": "email sent successfully",
	})
}

// supportForm handles support/contact form submissions
func (a *App) supportForm(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req supportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" || req.Email == "" || req.Subject == "" || req.Message == "" {
		writeError(w, http.StatusBadRequest, "name, email, subject and message are required")
		return
	}

	_, _, _, _, supportTo := getMailConfig()

	emailSubject := fmt.Sprintf("[Support] %s from %s", req.Subject, req.Name)
	htmlBody := fmt.Sprintf(`
    <h2>New Support Request</h2>
    <table style="border-collapse: collapse; width: 100%%;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">%s</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">%s</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Subject</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">%s</td>
      </tr>
    </table>
    <h3>Message</h3>
    <p style="background: #f5f5f5; padding: 16px; border-radius: 4px;">%s</p>
    <hr>
    <p style="font-size: 12px; color: #666;">Sent from PulseForge Payroll Support Form</p>
  `, req.Name, req.Email, req.Subject, strings.ReplaceAll(req.Message, "\n", "<br>"))

	if err := sendEmail([]string{supportTo}, emailSubject, htmlBody); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to send support email: %v", err))
		return
	}

	// Send confirmation to user
	confirmSubject := "Your support request has been received - PulseForge"
	confirmBody := fmt.Sprintf(`
    <h2>Hi %s,</h2>
    <p>Thank you for contacting PulseForge Support. We have received your message regarding:</p>
    <p><strong>%s</strong></p>
    <p>Our team will review your request and get back to you within 24-48 hours.</p>
    <hr>
    <p style="font-size: 12px; color: #666;">This is an automated confirmation. Please do not reply to this email.</p>
  `, req.Name, req.Subject)

	// Best effort confirmation email
	_ = sendEmail([]string{req.Email}, confirmSubject, confirmBody)

	writeJSON(w, http.StatusOK, map[string]any{
		"sent":    true,
		"message": "Support request submitted successfully",
	})
}
