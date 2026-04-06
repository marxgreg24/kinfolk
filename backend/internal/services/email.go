// email.go implements transactional email sending via the Resend API,
// providing typed helpers for invitation, conflict-alert and digest emails.
package services

import (
	"context"
	"fmt"
	"time"

	"github.com/kinfolk/backend/internal/config"
	resend "github.com/resend/resend-go/v2"
)

const fromAddress = "Kinfolk <no-reply@kinfolkapp.me>"

// emailShell wraps body content in the shared Kinfolk email layout.
// title is the pre-header / hero title shown at the top of the content area.
func emailShell(title, body string) string {
	year := time.Now().Year()
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Header bar -->
        <tr>
          <td style="background:#111111;border-radius:12px 12px 0 0;overflow:hidden;">
            <div style="height:3px;background:linear-gradient(90deg,transparent,#CDB53F,transparent);"></div>
            <div style="padding:24px 36px 20px;text-align:center;">
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;letter-spacing:6px;color:#ffffff;text-transform:uppercase;text-decoration:none;">KINFOLK</span>
              <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:5px;color:#CDB53F;text-transform:uppercase;margin-top:4px;opacity:0.8;">Preserve Your Roots</div>
            </div>
          </td>
        </tr>

        <!-- Content card -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 32px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">
            %s
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111111;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(205,181,63,0.3),transparent);margin-bottom:16px;"></div>
            <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:3px;text-transform:uppercase;">© %d Kinfolk</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:11px;">
              <a href="mailto:info@kinfolkapp.me" style="color:#CDB53F;text-decoration:none;">info@kinfolkapp.me</a>
              <span style="color:rgba(255,255,255,0.2);margin:0 8px;">·</span>
              <a href="https://kinfolkapp.me" style="color:rgba(255,255,255,0.35);text-decoration:none;">kinfolkapp.me</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`, title, body, year)
}

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
	body := fmt.Sprintf(`
    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:#A0522D;text-transform:uppercase;">Welcome</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#111111;line-height:1.3;">You are now a Clan Leader on Kinfolk</h1>
    <div style="width:40px;height:2px;background:#CDB53F;margin-bottom:24px;"></div>

    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 16px;">
      Hi <strong>%s</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 24px;">
      Your Clan Leader account has been set up on Kinfolk — the platform for building and preserving your family&rsquo;s legacy across generations.
    </p>

    <!-- Credentials block -->
    <table cellpadding="0" cellspacing="0" width="100%%" style="background:#faf9f6;border:1px solid #e8e4dc;border-radius:8px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A0522D;">Your Login Credentials</p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Georgia,serif;font-size:13px;color:#888;padding:5px 20px 5px 0;white-space:nowrap;">Email address</td>
            <td style="font-family:Georgia,serif;font-size:14px;color:#111;font-weight:bold;">%s</td>
          </tr>
          <tr>
            <td style="font-family:Georgia,serif;font-size:13px;color:#888;padding:5px 20px 5px 0;white-space:nowrap;">Temporary password</td>
            <td style="font-family:Georgia,serif;font-size:14px;color:#111;font-weight:bold;letter-spacing:1px;">%s</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-family:Georgia,serif;font-size:14px;color:#666;line-height:1.6;margin:0 0 28px;">
      Please sign in and <strong style="color:#A0522D;">reset your password immediately</strong> before inviting your clan members.
    </p>

    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="https://kinfolkapp.me/login" style="display:inline-block;background:#CDB53F;color:#ffffff;font-family:Georgia,serif;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:1px;">
        Sign In to Kinfolk &rarr;
      </a>
    </td></tr></table>

    <p style="font-family:Georgia,serif;font-size:12px;color:#aaa;margin-top:32px;line-height:1.6;">
      If you did not expect this account, contact us immediately at <a href="mailto:info@kinfolkapp.me" style="color:#A0522D;">info@kinfolkapp.me</a>.
    </p>`, fullName, toEmail, tempPassword)

	html := emailShell("Welcome to Kinfolk — Clan Leader Account", body)

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
	body := fmt.Sprintf(`
    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:#A0522D;text-transform:uppercase;">Clan Invitation</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#111111;line-height:1.3;">You have been added to the %s clan</h1>
    <div style="width:40px;height:2px;background:#CDB53F;margin-bottom:24px;"></div>

    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 16px;">
      Hi <strong>%s</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 24px;">
      A member of the <strong>%s</strong> clan has added you to their family tree on Kinfolk. Sign up using this email address and you will be automatically connected to your clan.
    </p>

    <!-- Clan highlight -->
    <table cellpadding="0" cellspacing="0" width="100%%" style="background:#faf9f6;border:1px solid #e8e4dc;border-left:4px solid #CDB53F;border-radius:0 8px 8px 0;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A0522D;">Clan</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#111111;">%s</p>
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="https://kinfolkapp.me/signup" style="display:inline-block;background:#CDB53F;color:#ffffff;font-family:Georgia,serif;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:1px;">
        Join Kinfolk &rarr;
      </a>
    </td></tr></table>

    <p style="font-family:Georgia,serif;font-size:12px;color:#aaa;margin-top:32px;line-height:1.6;">
      If you believe this was sent in error, you can safely ignore this email.
    </p>`, clanName, memberName, clanName, clanName)

	html := emailShell("You have been added to a clan on Kinfolk", body)

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

// SendWelcomeGeneralUser sends login credentials to a newly created general user.
func (s *EmailService) SendWelcomeGeneralUser(ctx context.Context, toEmail, fullName, clanName, tempPassword string) error {
	body := fmt.Sprintf(`
    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:#A0522D;text-transform:uppercase;">Welcome to Kinfolk</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#111111;line-height:1.3;">You have been added to the %s clan</h1>
    <div style="width:40px;height:2px;background:#CDB53F;margin-bottom:24px;"></div>

    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 16px;">
      Hi <strong>%s</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 24px;">
      Your clan leader has added you to the <strong>%s</strong> clan on Kinfolk — the platform for building and preserving your family&rsquo;s legacy across generations.
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 24px;">
      Your account is ready. Use the credentials below to sign in, then set a personal password to get started.
    </p>

    <!-- Credentials block -->
    <table cellpadding="0" cellspacing="0" width="100%%" style="background:#faf9f6;border:1px solid #e8e4dc;border-radius:8px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A0522D;">Your Login Credentials</p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:Georgia,serif;font-size:13px;color:#888;padding:5px 20px 5px 0;white-space:nowrap;">Email address</td>
            <td style="font-family:Georgia,serif;font-size:14px;color:#111;font-weight:bold;">%s</td>
          </tr>
          <tr>
            <td style="font-family:Georgia,serif;font-size:13px;color:#888;padding:5px 20px 5px 0;white-space:nowrap;">Temporary password</td>
            <td style="font-family:Georgia,serif;font-size:14px;color:#111;font-weight:bold;letter-spacing:1px;">%s</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="font-family:Georgia,serif;font-size:14px;color:#666;line-height:1.6;margin:0 0 28px;">
      Please sign in and <strong style="color:#A0522D;">set a personal password immediately</strong> to secure your account.
    </p>

    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="https://kinfolkapp.me/login" style="display:inline-block;background:#CDB53F;color:#ffffff;font-family:Georgia,serif;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:1px;">
        Sign In to Kinfolk &rarr;
      </a>
    </td></tr></table>

    <p style="font-family:Georgia,serif;font-size:12px;color:#aaa;margin-top:32px;line-height:1.6;">
      If you did not expect this invitation, contact us at <a href="mailto:info@kinfolkapp.me" style="color:#A0522D;">info@kinfolkapp.me</a>.
    </p>`, clanName, fullName, clanName, toEmail, tempPassword)

	html := emailShell("Welcome to Kinfolk — "+clanName+" Clan", body)

	params := &resend.SendEmailRequest{
		From:    fromAddress,
		To:      []string{toEmail},
		Subject: "Welcome to Kinfolk — You have been added to the " + clanName + " clan",
		Html:    html,
	}
	if _, err := s.client.Emails.Send(params); err != nil {
		return fmt.Errorf("services.EmailService.SendWelcomeGeneralUser: %w", err)
	}
	return nil
}

// SendInterestFormApproved notifies the submitter that their clan registration interest has been approved.
func (s *EmailService) SendInterestFormApproved(ctx context.Context, toEmail, fullName, clanName string) error {
	body := fmt.Sprintf(`
    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:#A0522D;text-transform:uppercase;">Great News</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#111111;line-height:1.3;">Your clan interest has been approved</h1>
    <div style="width:40px;height:2px;background:#CDB53F;margin-bottom:24px;"></div>

    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 16px;">
      Hi <strong>%s</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 24px;">
      Your interest in registering the <strong>%s</strong> clan on Kinfolk has been reviewed and approved by our team.
    </p>

    <!-- Approved clan block -->
    <table cellpadding="0" cellspacing="0" width="100%%" style="background:#faf9f6;border:1px solid #e8e4dc;border-left:4px solid #CDB53F;border-radius:0 8px 8px 0;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A0522D;">Approved Clan</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#111111;">%s</p>
      </td></tr>
    </table>

    <!-- What happens next -->
    <p style="margin:0 0 14px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#888888;">What happens next</p>
    <table cellpadding="0" cellspacing="0" width="100%%" style="margin-bottom:28px;">
      <tr>
        <td style="vertical-align:top;padding:0 16px 14px 0;white-space:nowrap;">
          <span style="display:inline-block;width:24px;height:24px;background:#CDB53F;border-radius:50%%;text-align:center;line-height:24px;font-family:Georgia,serif;font-size:11px;font-weight:bold;color:#fff;">1</span>
        </td>
        <td style="font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.6;padding-bottom:14px;">
          Our team will create your <strong>Clan Leader account</strong> and send your login credentials to this email address.
        </td>
      </tr>
      <tr>
        <td style="vertical-align:top;padding:0 16px 14px 0;white-space:nowrap;">
          <span style="display:inline-block;width:24px;height:24px;background:#CDB53F;border-radius:50%%;text-align:center;line-height:24px;font-family:Georgia,serif;font-size:11px;font-weight:bold;color:#fff;">2</span>
        </td>
        <td style="font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.6;padding-bottom:14px;">
          Sign in, reset your password, and start <strong>building your family tree</strong>.
        </td>
      </tr>
      <tr>
        <td style="vertical-align:top;padding:0 16px 0 0;white-space:nowrap;">
          <span style="display:inline-block;width:24px;height:24px;background:#CDB53F;border-radius:50%%;text-align:center;line-height:24px;font-family:Georgia,serif;font-size:11px;font-weight:bold;color:#fff;">3</span>
        </td>
        <td style="font-family:Georgia,serif;font-size:14px;color:#555;line-height:1.6;">
          Invite clan members to join and <strong>preserve your heritage</strong> for generations to come.
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="https://kinfolkapp.me" style="display:inline-block;background:#CDB53F;color:#ffffff;font-family:Georgia,serif;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:1px;">
        Explore Kinfolk &rarr;
      </a>
    </td></tr></table>

    <p style="font-family:Georgia,serif;font-size:12px;color:#aaa;margin-top:32px;line-height:1.6;">
      Questions? Reply to this email or reach us at <a href="mailto:info@kinfolkapp.me" style="color:#A0522D;">info@kinfolkapp.me</a>.
    </p>`, fullName, clanName, clanName)

	html := emailShell("Your Kinfolk clan interest has been approved", body)

	params := &resend.SendEmailRequest{
		From:    fromAddress,
		To:      []string{toEmail},
		Subject: "Your Kinfolk clan interest has been approved — " + clanName,
		Html:    html,
	}
	if _, err := s.client.Emails.Send(params); err != nil {
		return fmt.Errorf("services.EmailService.SendInterestFormApproved: %w", err)
	}
	return nil
}

// SendClanInterestConfirmation sends a confirmation to someone who expressed interest
// in joining an existing clan via the landing page.
func (s *EmailService) SendClanInterestConfirmation(ctx context.Context, toEmail, fullName, clanName string) error {
	body := fmt.Sprintf(`
    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;color:#A0522D;text-transform:uppercase;">Thank You</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#111111;line-height:1.3;">We've received your interest</h1>
    <div style="width:40px;height:2px;background:#CDB53F;margin-bottom:24px;"></div>

    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 16px;">
      Hi <strong>%s</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#444444;line-height:1.7;margin:0 0 24px;">
      Your expression of interest in joining the <strong>%s</strong> clan has been received. The clan leader will review your details and get in touch with you soon.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%%" style="background:#faf9f6;border:1px solid #e8e4dc;border-left:4px solid #CDB53F;border-radius:0 8px 8px 0;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A0522D;">Clan</p>
        <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#111111;">%s</p>
      </td></tr>
    </table>

    <p style="font-family:Georgia,serif;font-size:14px;color:#666;line-height:1.6;margin:0 0 28px;">
      The clan leader may call you to verify that you are indeed part of this clan before adding you to the system.
    </p>

    <p style="font-family:Georgia,serif;font-size:12px;color:#aaa;margin-top:32px;line-height:1.6;">
      Questions? Reach us at <a href="mailto:info@kinfolkapp.me" style="color:#A0522D;">info@kinfolkapp.me</a>.
    </p>`, fullName, clanName, clanName)

	html := emailShell("Interest in "+clanName+" Clan — Kinfolk", body)

	params := &resend.SendEmailRequest{
		From:    fromAddress,
		To:      []string{toEmail},
		Subject: "Your interest in the " + clanName + " clan has been received",
		Html:    html,
	}
	if _, err := s.client.Emails.Send(params); err != nil {
		return fmt.Errorf("services.EmailService.SendClanInterestConfirmation: %w", err)
	}
	return nil
}
