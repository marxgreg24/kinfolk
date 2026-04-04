// email.go implements transactional email sending via the Resend API,
// providing typed helpers for invitation, conflict-alert and digest emails.
package services

import (
	"context"
	"fmt"

	resend "github.com/resend/resend-go/v2"
	"github.com/kinfolk/backend/internal/config"
)

const fromAddress = "Kinfolk <no-reply@kinfolkapp.me>"

type EmailService struct {
	client *resend.Client
	cfg    *config.Config
}

func newEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		client: resend.NewClient(cfg.ResendAPIKey),
		cfg:    cfg,
	}
}

// SendWelcomeClanLeader sends login credentials to a newly created clan leader.
func (s *EmailService) SendWelcomeClanLeader(ctx context.Context, toEmail, fullName, tempPassword string) error {
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
  <h2 style="color:#CDB53F;">Welcome to Kinfolk, %s!</h2>
  <p>You have been set up as a <strong>Clan Leader</strong> on Kinfolk — the platform for building and preserving your family's legacy.</p>
  <p>Your login credentials are below. Please log in and reset your password immediately.</p>
  <table style="border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:4px 12px 4px 0;color:#555;">Email</td><td style="padding:4px 0;"><strong>%s</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#555;">Temporary Password</td><td style="padding:4px 0;"><strong>%s</strong></td></tr>
  </table>
  <p><a href="https://kinfolkapp.me" style="background:#CDB53F;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;">Log in to Kinfolk</a></p>
  <p style="color:#888;font-size:12px;margin-top:32px;">If you did not expect this email, please contact us at info@kinfolkapp.me.</p>
</body>
</html>`, fullName, toEmail, tempPassword)

	params := &resend.SendEmailRequest{
		From:    fromAddress,
		To:      []string{toEmail},
		Subject: "Welcome to Kinfolk — Your Clan Leader Account",
		Html:    html,
	}
	if _, err := s.client.Emails.Send(params); err != nil {
		return fmt.Errorf("services.EmailService.SendWelcomeClanLeader: %w", err)
	}
	return nil
}

// SendClanInvitation notifies a member that they have been added to a clan.
func (s *EmailService) SendClanInvitation(ctx context.Context, toEmail, memberName, clanName string) error {
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
  <h2 style="color:#CDB53F;">You have been added to the %s clan!</h2>
  <p>Hi %s,</p>
  <p>A member of the <strong>%s</strong> clan on Kinfolk has added you to their family tree.</p>
  <p>Sign up at <a href="https://kinfolkapp.me">kinfolkapp.me</a> using the email address this message was sent to, and you will be automatically connected to your clan.</p>
  <p><a href="https://kinfolkapp.me" style="background:#CDB53F;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;">Join Kinfolk</a></p>
  <p style="color:#888;font-size:12px;margin-top:32px;">If you believe this was sent in error, you can safely ignore this email.</p>
</body>
</html>`, clanName, memberName, clanName)

	params := &resend.SendEmailRequest{
		From:    fromAddress,
		To:      []string{toEmail},
		Subject: "You have been added to the " + clanName + " clan on Kinfolk",
		Html:    html,
	}
	if _, err := s.client.Emails.Send(params); err != nil {
		return fmt.Errorf("services.EmailService.SendClanInvitation: %w", err)
	}
	return nil
}
