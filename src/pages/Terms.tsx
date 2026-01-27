import { Layout } from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Terms and Conditions</h1>
              <p className="text-muted-foreground">Last updated January 21, 2026</p>
            </div>

            {/* Content */}
            <ScrollArea className="h-auto">
              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                
                {/* Agreement to Terms */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Agreement to Our Legal Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We are JumTunes ("Company," "we," "us," "our"), a company registered in New Jersey, United States at 112 Maple Ave, apt 1, Newark, NJ 07112.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We operate the website https://www.jumtunes.com (the "Site"), the mobile application JumTunes (the "App"), as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") (collectively, the "Services").
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    JumTunes is a digital music platform that allows artists and labels to upload and sell music directly to fans. Fans can purchase and permanently own music using credits, download tracks, and use purchased music on personal social media without copyright takedowns. JumTunes operates on an artist-first model, providing instant payouts, transparent earnings, and fair revenue sharing. The platform supports fans, artists, and labels through subscriptions, direct music purchases, playlists, and discovery tools.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You can contact us by phone at (+1)9084876435, email at info@jumtunes.com, or by mail to 112 Maple Ave, apt 1, Newark, NJ 07112, United States.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and JumTunes, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by support@jumtunes.com, as stated in the email message. By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We recommend that you print a copy of these Legal Terms for your records.
                  </p>
                </section>

                {/* Table of Contents */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Table of Contents</h2>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>Our Services</li>
                    <li>Intellectual Property Rights</li>
                    <li>User Representations</li>
                    <li>User Registration</li>
                    <li>Purchases and Payment</li>
                    <li>Subscriptions</li>
                    <li>Prohibited Activities</li>
                    <li>User Generated Contributions</li>
                    <li>Contribution License</li>
                    <li>Guidelines for Reviews</li>
                    <li>Mobile Application License</li>
                    <li>Social Media</li>
                    <li>Advertisers</li>
                    <li>Services Management</li>
                    <li>Privacy Policy</li>
                    <li>Digital Millennium Copyright Act (DMCA) Notice and Policy</li>
                    <li>Term and Termination</li>
                    <li>Modifications and Interruptions</li>
                    <li>Governing Law</li>
                    <li>Dispute Resolution</li>
                    <li>Corrections</li>
                    <li>Disclaimer</li>
                    <li>Limitations of Liability</li>
                    <li>Indemnification</li>
                    <li>User Data</li>
                    <li>Electronic Communications, Transactions, and Signatures</li>
                    <li>California Users and Residents</li>
                    <li>Miscellaneous</li>
                    <li>DMCA Copyright Policy and Repeat Infringer Policy</li>
                    <li>Music Purchase Ownership and Verified Personal Use Rights</li>
                    <li>Contact Us</li>
                  </ol>
                </section>

                {/* 1. Our Services */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. Our Services</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Services are not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).
                  </p>
                </section>

                {/* 2. Intellectual Property Rights */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. Intellectual Property Rights</h2>
                  
                  <h3 className="text-xl font-medium text-foreground">Our intellectual property</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties in the United States and around the world.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use or internal business purpose only.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Your use of our Services</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you a non-exclusive, non-transferable, revocable license to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>access the Services; and</li>
                    <li>download or print a copy of any portion of the Content to which you have properly gained access, solely for your personal, non-commercial use or internal business purpose.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: info@jumtunes.com. If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Your submissions and contributions</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Please review this section and the "PROHIBITED ACTIVITIES" section carefully prior to using our Services to understand the (a) rights you give us and (b) obligations you have when you post or upload any content through the Services.
                  </p>

                  <h4 className="text-lg font-medium text-foreground">Submissions</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ("Submissions"), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.
                  </p>

                  <h4 className="text-lg font-medium text-foreground">Contributions</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality during which you may create, submit, post, display, transmit, publish, distribute, or broadcast content and materials to us or through the Services, including but not limited to text, writings, video, audio, photographs, music, graphics, comments, reviews, rating suggestions, personal information, or other material ("Contributions"). Any Submission that is publicly posted shall also be treated as a Contribution.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You understand that Contributions may be viewable by other users of the Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    When you post Contributions, you grant us a license (including use of your name, trademarks, and logos): By posting any Contributions, you grant us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to: use, copy, reproduce, distribute, sell, resell, publish, broadcast, retitle, store, publicly perform, publicly display, reformat, translate, excerpt (in whole or in part), and exploit your Contributions (including, without limitation, your image, name, and voice) for any purpose, commercial, advertising, or otherwise, to prepare derivative works of, or incorporate into other works, your Contributions, and to sublicense the licenses granted in this section. Our use and distribution may occur in any media formats and through any media channels.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This license includes our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service marks, trade names, logos, and personal and commercial images you provide.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You are responsible for what you post or upload: By sending us Submissions and/or posting Contributions through any part of the Services or making Contributions accessible through the Services by linking your account through the Services to any of your social networking accounts, you:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>confirm that you have read and agree with our "PROHIBITED ACTIVITIES" and will not post, send, publish, upload, or transmit through the Services any Submission nor post any Contribution that is illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading;</li>
                    <li>to the extent permissible by applicable law, waive any and all moral rights to any such Submission and/or Contribution;</li>
                    <li>warrant that any such Submission and/or Contributions are original to you or that you have the necessary rights and licenses to submit such Submissions and/or Contributions and that you have full authority to grant us the above-mentioned rights in relation to your Submissions and/or Contributions; and</li>
                    <li>warrant and represent that your Submissions and/or Contributions do not constitute confidential information.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    You are solely responsible for your Submissions and/or Contributions and you expressly agree to reimburse us for any and all losses that we may suffer because of your breach of (a) this section, (b) any third party's intellectual property rights, or (c) applicable law.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We may remove or edit your Content: Although we have no obligation to monitor any Contributions, we shall have the right to remove or edit any Contributions at any time without notice if in our reasonable opinion we consider such Contributions harmful or in breach of these Legal Terms. If we remove or edit any such Contributions, we may also suspend or disable your account and report you to the authorities.
                  </p>

                  <h4 className="text-lg font-medium text-foreground">Copyright infringement</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately refer to the "DIGITAL MILLENNIUM COPYRIGHT ACT (DMCA) NOTICE AND POLICY" section below.
                  </p>
                </section>

                {/* 3. User Representations */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. User Representations</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorized purpose; and (7) your use of the Services will not violate any applicable law or regulation.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).
                  </p>
                </section>

                {/* 4. User Registration */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. User Registration</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                  </p>
                </section>

                {/* 5. Purchases and Payment */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Purchases and Payment</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We accept the following forms of payment:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Visa</li>
                    <li>Mastercard</li>
                    <li>Discover</li>
                    <li>American Express</li>
                    <li>PayPal</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.
                  </p>
                </section>

                {/* 6. Subscriptions */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. Subscriptions</h2>
                  
                  <h3 className="text-xl font-medium text-foreground">Billing and Renewal</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle is monthly.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Free Trial</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We offer a 90-day free trial to new users who register with the Services. The account will be charged according to the user's chosen subscription at the end of the free trial.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Cancellation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All purchases are non-refundable. You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at info@jumtunes.com.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Fee Changes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.
                  </p>
                </section>

                {/* 7. Prohibited Activities */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Prohibited Activities</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    As a user of the Services, you agree not to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                    <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                    <li>Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.</li>
                    <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
                    <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
                    <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
                    <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
                    <li>Engage in unauthorized framing of or linking to the Services.</li>
                    <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party's uninterrupted use and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.</li>
                    <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
                    <li>Delete the copyright or other proprietary rights notice from any Content.</li>
                    <li>Attempt to impersonate another user or person or use the username of another user.</li>
                    <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ("gifs"), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as "spyware" or "passive collection mechanisms" or "pcms").</li>
                    <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
                    <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
                    <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
                    <li>Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
                    <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
                    <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or use or launch any unauthorized script or other software.</li>
                    <li>Use a buying agent or purchasing agent to make purchases on the Services.</li>
                    <li>Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
                    <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
                    <li>Sell or otherwise transfer your profile.</li>
                    <li>Attempting to bypass, manipulate, or interfere with JumTunes' credit system, ownership verification, payout mechanisms, or usage-rights protections.</li>
                    <li>Engaging in fraudulent activity, including artificial streaming, fake purchases, chargeback abuse, or manipulation of artist earnings or analytics.</li>
                    <li>Using platform content to train artificial intelligence, machine learning models, or datasets without explicit written authorization from JumTunes and the rights holder.</li>
                    <li>Submitting false, misleading, or bad-faith copyright or DMCA takedown notices, including attempts to remove lawfully purchased or licensed content.</li>
                  </ul>
                </section>

                {/* 8. User Generated Contributions */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. User Generated Contributions</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions"). Contributions may be viewable by other users of the Services and through third-party websites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    When you create or make available any Contributions, you thereby represent and warrant that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.</li>
                    <li>You are the creator and owner of or have the necessary licenses, rights, consents, releases, and permissions to use and to authorize us, the Services, and other users of the Services to use your Contributions in any manner contemplated by the Services and these Legal Terms.</li>
                    <li>You have the written consent, release, and/or permission of each and every identifiable individual person in your Contributions to use the name or likeness of each and every such identifiable individual person to enable inclusion and use of your Contributions in any manner contemplated by the Services and these Legal Terms.</li>
                    <li>Your Contributions are not false, inaccurate, or misleading.</li>
                    <li>Your Contributions are not unsolicited or unauthorized advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.</li>
                    <li>Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libelous, slanderous, or otherwise objectionable (as determined by us).</li>
                    <li>Your Contributions do not ridicule, mock, disparage, intimidate, or abuse anyone.</li>
                    <li>Your Contributions are not used to harass or threaten (in the legal sense of those terms) any other person and to promote violence against a specific person or class of people.</li>
                    <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
                    <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
                    <li>Your Contributions do not violate any applicable law concerning child pornography, or otherwise intended to protect the health or well-being of minors.</li>
                    <li>Your Contributions do not include any offensive comments that are connected to race, national origin, gender, sexual preference, or physical handicap.</li>
                    <li>Your Contributions do not otherwise violate, or link to material that violates, any provision of these Legal Terms, or any applicable law or regulation.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Any use of the Services in violation of the foregoing violates these Legal Terms and may result in, among other things, termination or suspension of your rights to use the Services.
                  </p>
                </section>

                {/* 9. Contribution License */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. Contribution License</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By posting your Contributions to any part of the Services or making Contributions accessible to the Services by linking your account from the Services to any of your social networking accounts, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions (including, without limitation, your image and voice) for any purpose, commercial, advertising, or otherwise, and to prepare derivative works of, or incorporate into other works, such Contributions, and grant and authorize sublicenses of the foregoing. The use and distribution may occur in any media formats and through any media channels.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This license will apply to any form, media, or technology now known or hereafter developed, and includes our use of your name, company name, and franchise name, as applicable, and any of the trademarks, service marks, trade names, logos, and personal and commercial images you provide. You waive all moral rights in your Contributions, and you warrant that moral rights have not otherwise been asserted in your Contributions.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Services. You are solely responsible for your Contributions to the Services and you expressly agree to exonerate us from any and all responsibility and to refrain from any legal action against us regarding your Contributions.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We have the right, in our sole and absolute discretion, (1) to edit, redact, or otherwise change any Contributions; (2) to re-categorize any Contributions to place them in more appropriate locations on the Services; and (3) to pre-screen or delete any Contributions at any time and for any reason, without notice. We have no obligation to monitor your Contributions.
                  </p>
                </section>

                {/* 10. Guidelines for Reviews */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. Guidelines for Reviews</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may provide you areas on the Services to leave reviews or ratings. When posting a review, you must comply with the following criteria:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                    <li>you should have firsthand experience with the person/entity being reviewed;</li>
                    <li>your reviews should not contain offensive profanity, or abusive, racist, offensive, or hateful language;</li>
                    <li>your reviews should not contain discriminatory references based on religion, race, gender, national origin, age, marital status, sexual orientation, or disability;</li>
                    <li>your reviews should not contain references to illegal activity;</li>
                    <li>you should not be affiliated with competitors if posting negative reviews;</li>
                    <li>you should not make any conclusions as to the legality of conduct;</li>
                    <li>you may not post any false or misleading statements; and</li>
                    <li>you may not organize a campaign encouraging others to post reviews, whether positive or negative.</li>
                  </ol>
                  <p className="text-muted-foreground leading-relaxed">
                    We may accept, reject, or remove reviews in our sole discretion. We have absolutely no obligation to screen reviews or to delete reviews, even if anyone considers reviews objectionable or inaccurate. Reviews are not endorsed by us, and do not necessarily represent our opinions or the views of any of our affiliates or partners. We do not assume liability for any review or for any claims, liabilities, or losses.
                  </p>
                </section>

                {/* 11. Mobile Application License */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">11. Mobile Application License</h2>
                  
                  <h3 className="text-xl font-medium text-foreground">Use License</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you access the Services via the App, then we grant you a revocable, non-exclusive, non-transferable, limited right to install and use the App on wireless electronic devices owned or controlled by you, and to access and use the App on such devices strictly in accordance with the terms and conditions of this mobile application license contained in these Legal Terms. You shall not:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                    <li>except as permitted by applicable law, decompile, reverse engineer, disassemble, attempt to derive the source code of, or decrypt the App;</li>
                    <li>make any modification, adaptation, improvement, enhancement, translation, or derivative work from the App;</li>
                    <li>violate any applicable laws, rules, or regulations in connection with your access or use of the App;</li>
                    <li>remove, alter, or obscure any proprietary notice (including any notice of copyright or trademark) posted by us or the licensors of the App;</li>
                    <li>use the App for any revenue-generating endeavor, commercial enterprise, or other purpose for which it is not designed or intended;</li>
                    <li>make the App available over a network or other environment permitting access or use by multiple devices or users at the same time;</li>
                    <li>use the App for creating a product, service, or software that is, directly or indirectly, competitive with or in any way a substitute for the App;</li>
                    <li>use the App to send automated queries to any website or to send any unsolicited commercial email; or</li>
                    <li>use any proprietary information or any of our interfaces or our other intellectual property in the design, development, manufacture, licensing, or distribution of any applications, accessories, or devices for use with the App.</li>
                  </ol>

                  <h3 className="text-xl font-medium text-foreground">Apple and Android Devices</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The following terms apply when you use the App obtained from either the Apple Store or Google Play (each an "App Distributor") to access the Services:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                    <li>the license granted to you for our App is limited to a non-transferable license to use the application on a device that utilizes the Apple iOS or Android operating systems, as applicable, and in accordance with the usage rules set forth in the applicable App Distributor's terms of service;</li>
                    <li>we are responsible for providing any maintenance and support services with respect to the App as specified in the terms and conditions of this mobile application license contained in these Legal Terms or as otherwise required under applicable law, and you acknowledge that each App Distributor has no obligation whatsoever to furnish any maintenance and support services with respect to the App;</li>
                    <li>in the event of any failure of the App to conform to any applicable warranty, you may notify the applicable App Distributor, and the App Distributor, in accordance with its terms and policies, may refund the purchase price, if any, paid for the App, and to the maximum extent permitted by applicable law, the App Distributor will have no other warranty obligation whatsoever with respect to the App;</li>
                    <li>you represent and warrant that (i) you are not located in a country that is subject to a US government embargo, or that has been designated by the US government as a "terrorist supporting" country and (ii) you are not listed on any US government list of prohibited or restricted parties;</li>
                    <li>you must comply with applicable third-party terms of agreement when using the App, e.g., if you have a VoIP application, then you must not be in violation of their wireless data service agreement when using the App; and</li>
                    <li>you acknowledge and agree that the App Distributors are third-party beneficiaries of the terms and conditions in this mobile application license contained in these Legal Terms, and that each App Distributor will have the right (and will be deemed to have accepted the right) to enforce the terms and conditions in this mobile application license contained in these Legal Terms against you as a third-party beneficiary thereof.</li>
                  </ol>
                </section>

                {/* 12. Social Media */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">12. Social Media</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    As part of the functionality of the Services, you may link your account with online accounts you have with third-party service providers (each such account, a "Third-Party Account") by either: (1) providing your Third-Party Account login information through the Services; or (2) allowing us to access your Third-Party Account, as is permitted under the applicable terms and conditions that govern your use of each Third-Party Account. You represent and warrant that you are entitled to disclose your Third-Party Account login information to us and/or grant us access to your Third-Party Account, without breach by you of any of the terms and conditions that govern your use of the applicable Third-Party Account, and without obligating us to pay any fees or making us subject to any usage limitations imposed by the third-party service provider of the Third-Party Account.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By granting us access to any Third-Party Accounts, you understand that (1) we may access, make available, and store (if applicable) any content that you have provided to and stored in your Third-Party Account (the "Social Network Content") so that it is available on and through the Services via your account, including without limitation any friend lists and (2) we may submit to and receive from your Third-Party Account additional information to the extent you are notified when you link your account with the Third-Party Account.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    PLEASE NOTE THAT YOUR RELATIONSHIP WITH THE THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR THIRD-PARTY ACCOUNTS IS GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS. We make no effort to review any Social Network Content for any purpose, including but not limited to, for accuracy, legality, or non-infringement, and we are not responsible for any Social Network Content.
                  </p>
                </section>

                {/* 13. Advertisers */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">13. Advertisers</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We allow advertisers to display their advertisements and other information in certain areas of the Services, such as sidebar advertisements or banner advertisements. We simply provide the space to place such advertisements, and we have no other relationship with advertisers.
                  </p>
                </section>

                {/* 14. Services Management */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">14. Services Management</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.
                  </p>
                </section>

                {/* 15. Privacy Policy */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">15. Privacy Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We care about data privacy and security. Please review our Privacy Policy: http://www.jumtunes.com/privacy-policy. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United States. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United States, then through your continued use of the Services, you are transferring your data to the United States, and you expressly consent to have your data transferred to and processed in the United States.
                  </p>
                </section>

                {/* 16. DMCA */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">16. Digital Millennium Copyright Act (DMCA) Notice and Policy</h2>
                  
                  <h3 className="text-xl font-medium text-foreground">Notifications</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately notify our Designated Copyright Agent using the contact information provided below (a "Notification"). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to federal law you may be held liable for damages if you make material misrepresentations in a Notification. Thus, if you are not sure that material located on or linked to by the Services infringes your copyright, you should consider first contacting an attorney.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    All Notifications should meet the requirements of DMCA 17 U.S.C. § 512(c)(3) and include the following information:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                    <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed;</li>
                    <li>Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works on the Services are covered by the Notification, a representative list of such works on the Services;</li>
                    <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material;</li>
                    <li>Information reasonably sufficient to permit us to contact the complaining party, such as an address, telephone number, and, if available, an email address at which the complaining party may be contacted;</li>
                    <li>A statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law; and</li>
                    <li>A statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed upon.</li>
                  </ol>

                  <h3 className="text-xl font-medium text-foreground">Counter Notification</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you believe your own copyrighted material has been removed from the Services as a result of a mistake or misidentification, you may submit a written counter notification to our Designated Copyright Agent using the contact information provided below (a "Counter Notification"). To be an effective Counter Notification under the DMCA, your Counter Notification must include substantially the following:
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Identification of the material that has been removed or disabled and the location at which the material appeared before it was removed or disabled;</li>
                    <li>a statement that you consent to the jurisdiction of the Federal District Court in which your address is located, or if your address is outside the United States, for any judicial district in which we are located;</li>
                    <li>a statement that you will accept service of process from the party that filed the Notification or the party's agent;</li>
                    <li>your name, address, and telephone number;</li>
                    <li>a statement under penalty of perjury that you have a good faith belief that the material in question was removed or disabled as a result of a mistake or misidentification of the material to be removed or disabled; and</li>
                    <li>your physical or electronic signature.</li>
                  </ol>

                  <h3 className="text-xl font-medium text-foreground">Designated Copyright Agent</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Jeremiah Thomas<br />
                    Attn: Copyright Agent<br />
                    112 Maple ave, apt 1<br />
                    Newark, NJ 07112<br />
                    United States<br />
                    freshbeatz718@gmail.com
                  </p>
                </section>

                {/* 17. Term and Termination */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">17. Term and Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.
                  </p>
                </section>

                {/* 18. Modifications and Interruptions */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">18. Modifications and Interruptions</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services.
                  </p>
                </section>

                {/* 19. Governing Law */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">19. Governing Law</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These Legal Terms and your use of the Services are governed by and construed in accordance with the laws of the State of New Jersey applicable to agreements made and to be entirely performed within the State of New Jersey, without regard to its conflict of law principles.
                  </p>
                </section>

                {/* 20. Dispute Resolution */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">20. Dispute Resolution</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Any legal action of whatever nature brought by either you or us (collectively, the "Parties" and individually, a "Party") shall be commenced or prosecuted in the state and federal courts located in Essex, New Jersey, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction and forum non conveniens with respect to venue and jurisdiction in such state and federal courts.
                  </p>
                </section>

                {/* 21. Corrections */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">21. Corrections</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.
                  </p>
                </section>

                {/* 22. Disclaimer */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">22. Disclaimer</h2>
                  <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                    THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.
                  </p>
                  <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                    WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND EXERCISE CAUTION WHERE APPROPRIATE.
                  </p>
                </section>

                {/* 23. Limitations of Liability */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">23. Limitations of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                    IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE LESSER OF THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING OR $250.00 USD. CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
                  </p>
                </section>

                {/* 24. Indemnification */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">24. Indemnification</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties set forth in these Legal Terms; (5) your violation of the rights of a third party, including but not limited to intellectual property rights; or (6) any overt harmful act toward any other user of the Services with whom you connected via the Services. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.
                  </p>
                </section>

                {/* 25. User Data */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">25. User Data</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.
                  </p>
                </section>

                {/* 26. Electronic Communications */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">26. Electronic Communications, Transactions, and Signatures</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES. You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means.
                  </p>
                </section>

                {/* 27. California Users */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">27. California Users and Residents</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
                  </p>
                </section>

                {/* 28. Miscellaneous */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">28. Miscellaneous</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms or use of the Services. You agree that these Legal Terms will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of these Legal Terms and the lack of signing by the parties hereto to execute these Legal Terms.
                  </p>
                </section>

                {/* 29. DMCA Policy */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">29. DMCA Copyright Policy and Repeat Infringer Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    JumTunes respects the intellectual property rights of others and expects users of the platform to do the same. In accordance with the Digital Millennium Copyright Act ("DMCA"), JumTunes has adopted a policy to respond to notices of alleged copyright infringement that comply with applicable law. Upon receipt of a valid DMCA takedown notice, JumTunes will promptly remove or disable access to the allegedly infringing material. JumTunes maintains a policy of terminating, in appropriate circumstances and at its sole discretion, users who are deemed to be repeat infringers. Users who upload, distribute, or otherwise make available content that infringes the intellectual property rights of others may have their accounts suspended or terminated without notice. Copyright owners or their authorized agents may submit infringement notifications to JumTunes' designated copyright agent in accordance with the DMCA. Users who believe their content was removed in error may submit a valid counter-notification as permitted by law. JumTunes reserves the right to restore content removed under the DMCA if a valid counter-notification is received and no legal action is initiated by the complaining party.
                  </p>
                </section>

                {/* 30. Music Purchase Ownership */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">30. Music Purchase Ownership and Verified Personal Use Rights</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    JumTunes allows users to purchase and permanently own digital music through the platform. Upon purchase, users are granted a non-exclusive, non-transferable, revocable license to download, store, and use purchased music for personal, non-commercial purposes. Users are permitted to use music purchased on JumTunes in personal content shared on social media platforms, including but not limited to background audio in videos, stories, or posts, without automated copyright takedowns, provided such use remains non-commercial and complies with these Terms. This permitted use does not constitute a transfer of ownership or copyright and does not allow redistribution, resale, sublicensing, public performance for profit, or commercial exploitation of the music. All copyrights, master recordings, and intellectual property rights remain the sole property of the respective artists, rights holders, or licensors. JumTunes does not grant any commercial usage rights unless explicitly stated in writing. Any use beyond the scope of this license may result in content removal, account suspension, or termination.
                  </p>
                </section>

                {/* 31. Contact Us */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">31. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>JumTunes</strong><br />
                    112 Maple Ave, apt 1<br />
                    Newark, NJ 07112<br />
                    United States<br />
                    Phone: (+1)9084876435<br />
                    Email: info@jumtunes.com
                  </p>
                </section>

              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
}
