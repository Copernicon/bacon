import nodemailer from 'nodemailer';
import email from '/core/backend/data/email.json' assert { type: 'json' };

/**
	@typedef {{ recipient: string, subject: string, html: string, text?: string }} MailSendData
	A data used to send an e-mail.

	Properties:
	- `recipient` — E-mail recipient.
	- `subject` — E-mail subject.
	- `html` — HTML version of a message to send.
	- `text` — Plaintext version of a message to send.

	If `text` is missing, `html` version stripped of tags shall be used instead.

	Related data file:
	- {@link email `/core/backend/data/email.json`}

	Depends on:
	- {@link nodemailer `nodemailer`}

	Related class:
	- {@link Mail `Mail`}
*/
export {};

/**
	Sends e-mails.

	Dependency:
	- {@link nodemailer `nodemailer`}

	Related data file:
	- {@link email `/core/backend/data/email.json`}
*/
export default class Mail
{
	/**
		Sends an e-mail.
		@return Indicator if an e-mail has been successfully sent.
	*/
	static async send(/** @type {MailSendData} */ data)
	{
		try
		{
			const transporter = nodemailer.createTransport(
			{
				host: email.host,
				port: email.port,
				secure: email.port == 465,
				auth: {
					user: email.user,
					pass: email.password,
				},
			});

			await transporter.sendMail(
			{
				from: email.from,
				to: data.recipient,
				subject: data.subject,
				text: data.text ?? data.html.replaceAll(/(<([^>]+)>)/igu, ''),
				html: data.html,
			});

			return true;
		}
		catch
		{
			return false;
		}
	}
}