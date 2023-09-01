// const nodemailer = require("nodemailer");
import nodemailer from "nodemailer"

export default async function notifyB2bCustomers(customers) {
    console.log('notify nodemailer', customers)

    const transporter = nodemailer.createTransport({
        host: "send.one.com",
        port: 465,
        secure: true,
        auth: {
            user: "yarrut@gloskinbeauty.be",
            pass: "Kerstman1!",
        },
    });
    const sendEmail = (email, fname, lname, discountCode, discountAmount, discountStart, discountEnd) => {
        async function main() {
            // send mail with defined transport object
            const info = await transporter.sendMail({
                from: '"Fred Foo 👻" <yarrut@gloskinbeauty.be>', // sender address
                to: email, // list of receivers
                subject: `Hallo ${fname}! Je persoonlijke discount code ligt klaar om te gebruiken!`, // Subject line
                text: "Je persoonlijke discount code ligt klaar!", // plain text body
                html: `
                <b>Hello  ${fname},<br>
                code: ${discountCode}<br>
                amount: ${discountAmount}<br>
                start: ${discountStart}<br>
                end: ${discountEnd}<br>
                </b>`, // html body
            });
            console.log("Message sent: %s", info.messageId);
        }

        main().catch(console.error);

        console.log('notify nodemailer end')
    }

    customers.forEach((customer) => {
        const email = customer.nearestB2BCustomer.b2bCustomer.email
        const fname = customer.nearestB2BCustomer.b2bCustomer.firstName
        const lname = customer.nearestB2BCustomer.b2bCustomer.lastName
        const discountCode = customer.nearestB2BCustomer.discountCode
        const discountAmount = customer.nearestB2BCustomer.discountAmount
        const discountStart = customer.nearestB2BCustomer.discountStart
        const discountEnd = customer.nearestB2BCustomer.discountEnd

        sendEmail(email, fname, lname, discountCode, discountAmount, discountStart, discountEnd)
    })
}