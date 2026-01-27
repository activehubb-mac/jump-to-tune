import { Layout } from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Privacy() {
  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated January 21, 2026</p>
            </div>

            {/* Content */}
            <ScrollArea className="h-auto">
              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                {/* Introduction */}
                <section className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    This Privacy Notice for JumTunes ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Visit our website at https://www.jumtunes.com or any website of ours that links to this Privacy Notice</li>
                    <li>Download and use our mobile application (JumTunes), or any other application of ours that links to this Privacy Notice</li>
                    <li>Use JumTunes. JumTunes is a digital music platform that allows artists and labels to upload and sell music directly to fans. Fans can purchase and permanently own music using credits, download tracks, and use purchased music on personal social media without copyright takedowns. JumTunes operates on an artist-first model, providing instant payouts, transparent earnings, and fair revenue sharing. The platform supports fans, artists, and labels through subscriptions, direct music purchases, playlists, and discovery tools.</li>
                    <li>Engage with us in other related ways, including any marketing or events</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at freshbeatz718@gmail.com.
                  </p>
                </section>

                {/* Summary of Key Points */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Summary of Key Points</h2>
                  <p className="text-muted-foreground leading-relaxed italic">
                    This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">What personal information do we process?</h3>
                      <p className="text-muted-foreground">When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Do we process any sensitive personal information?</h3>
                      <p className="text-muted-foreground">We do not process sensitive personal information.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Do we collect any information from third parties?</h3>
                      <p className="text-muted-foreground">We do not collect any information from third parties.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">How do we process your information?</h3>
                      <p className="text-muted-foreground">We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">In what situations and with which types of parties do we share personal information?</h3>
                      <p className="text-muted-foreground">We may share information in specific situations and with specific categories of third parties.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">How do we keep your information safe?</h3>
                      <p className="text-muted-foreground">We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">What are your rights?</h3>
                      <p className="text-muted-foreground">Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">How do you exercise your rights?</h3>
                      <p className="text-muted-foreground">The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>
                    </div>
                  </div>
                </section>

                {/* Table of Contents */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Table of Contents</h2>
                  <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
                    <li><a href="#section-1" className="text-primary hover:underline">WHAT INFORMATION DO WE COLLECT?</a></li>
                    <li><a href="#section-2" className="text-primary hover:underline">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
                    <li><a href="#section-3" className="text-primary hover:underline">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></li>
                    <li><a href="#section-4" className="text-primary hover:underline">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
                    <li><a href="#section-5" className="text-primary hover:underline">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
                    <li><a href="#section-6" className="text-primary hover:underline">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></li>
                    <li><a href="#section-7" className="text-primary hover:underline">IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</a></li>
                    <li><a href="#section-8" className="text-primary hover:underline">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
                    <li><a href="#section-9" className="text-primary hover:underline">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
                    <li><a href="#section-10" className="text-primary hover:underline">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
                    <li><a href="#section-11" className="text-primary hover:underline">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
                    <li><a href="#section-12" className="text-primary hover:underline">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
                    <li><a href="#section-13" className="text-primary hover:underline">DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></li>
                    <li><a href="#section-14" className="text-primary hover:underline">DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?</a></li>
                    <li><a href="#section-15" className="text-primary hover:underline">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
                    <li><a href="#section-16" className="text-primary hover:underline">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
                    <li><a href="#section-17" className="text-primary hover:underline">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
                  </ol>
                </section>

                {/* Section 1 */}
                <section id="section-1" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. What Information Do We Collect?</h2>
                  
                  <h3 className="text-xl font-medium text-foreground">Personal information you disclose to us</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We collect personal information that you provide to us.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Names</li>
                    <li>Email addresses</li>
                    <li>Usernames</li>
                    <li>Passwords</li>
                    <li>Contact or authentication data</li>
                  </ul>

                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Sensitive Information.</strong> We do not process sensitive information.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe. You may find their privacy notice link(s) here: <a href="https://stripe.com/privacy" className="text-primary hover:underline">https://stripe.com/privacy</a>.
                  </p>

                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section called "HOW DO WE HANDLE YOUR SOCIAL LOGINS?" below.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Application Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Mobile Device Data.</strong> We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model Internet service provider and/or mobile carrier, and Internet Protocol (IP) address (or proxy server).</li>
                    <li><strong>Push Notifications.</strong> We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device's settings.</li>
                  </ul>

                  <h3 className="text-xl font-medium text-foreground">Information automatically collected</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Like many businesses, we also collect information through cookies and similar technologies.
                  </p>

                  <p className="text-muted-foreground leading-relaxed"><strong>The information we collect includes:</strong></p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Log and Usage Data.</strong> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files.</li>
                    <li><strong>Device Data.</strong> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services.</li>
                    <li><strong>Location Data.</strong> We collect location data such as information about your device's location, which can be either precise or imprecise.</li>
                  </ul>
                </section>

                {/* Section 2 */}
                <section id="section-2" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. How Do We Process Your Information?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>To facilitate account creation and authentication</strong> and otherwise manage user accounts.</li>
                    <li><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
                    <li><strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</li>
                    <li><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
                    <li><strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</li>
                    <li><strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.</li>
                    <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section id="section-3" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. What Legal Bases Do We Rely On to Process Your Information?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
                  </p>
                  
                  <h3 className="text-xl font-medium text-foreground">If you are located in the EU or UK</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li><strong>Consent.</strong> We may process your information if you have given us permission (i.e., consent) to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
                    <li><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
                    <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations.</li>
                    <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party.</li>
                  </ul>

                  <h3 className="text-xl font-medium text-foreground">If you are located in Canada</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
                    <li>For investigations and fraud detection and prevention</li>
                    <li>For business transactions provided certain conditions are met</li>
                    <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
                    <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
                    <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
                    <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
                    <li>If the information is publicly available and is specified by the regulations</li>
                  </ul>
                </section>

                {/* Section 4 */}
                <section id="section-4" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. When and With Whom Do We Share Your Personal Information?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following categories of third parties.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Vendors, Consultants, and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors, service providers, contractors, or agents ("third parties") who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">The categories of third parties we may share personal information with are as follows:</p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Payment Processors</li>
                    <li>Cloud Computing Services</li>
                    <li>Data Storage Service Providers</li>
                    <li>Website Hosting Service Providers</li>
                    <li>Performance Monitoring Tools</li>
                    <li>User Account Registration & Authentication Services</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    We also may need to share your personal information in the following situations:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section id="section-5" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Do We Use Cookies and Other Tracking Technologies?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences).
                  </p>
                </section>

                {/* Section 6 */}
                <section id="section-6" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. How Do We Handle Your Social Logins?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.
                  </p>
                </section>

                {/* Section 7 */}
                <section id="section-7" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Is Your Information Transferred Internationally?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We may transfer, store, and process your information in countries other than your own.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our servers are located in the United States. If you are accessing our Services from outside the United States, please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information, including facilities in the United States and other countries.
                  </p>
                </section>

                {/* Section 8 */}
                <section id="section-8" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. How Long Do We Keep Your Information?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="section-9" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. How Do We Keep Your Information Safe?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
                  </p>
                </section>

                {/* Section 10 */}
                <section id="section-10" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. Do We Collect Information from Minors?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age or the equivalent age as specified by law in your jurisdiction.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not knowingly collect, solicit data from, or market to children under 18 years of age or the equivalent age as specified by law in your jurisdiction, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or the equivalent age as specified by law in your jurisdiction or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If we learn that personal information from users less than 18 years of age or the equivalent age as specified by law in your jurisdiction has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18 or the equivalent age as specified by law in your jurisdiction, please contact us at privacy@jumtunes.com.
                  </p>
                </section>

                {/* Section 11 */}
                <section id="section-11" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">11. What Are Your Privacy Rights?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Withdrawing your consent</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Account Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you would at any time like to review or change the information in your account or terminate your account, you can:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Log in to your account settings and update your user account.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Cookies and similar technologies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have questions or comments about your privacy rights, you may email us at freshbeatz718@gmail.com.
                  </p>
                </section>

                {/* Section 12 */}
                <section id="section-12" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">12. Controls for Do-Not-Track Features</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.
                  </p>
                </section>

                {/* Section 13 */}
                <section id="section-13" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">13. Do United States Residents Have Specific Privacy Rights?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Categories of Personal Information We Collect</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We have collected the following categories of personal information in the past twelve (12) months:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left text-foreground border-b">Category</th>
                          <th className="px-4 py-2 text-left text-foreground border-b">Examples</th>
                          <th className="px-4 py-2 text-left text-foreground border-b">Collected</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr><td className="px-4 py-2 border-b">A. Identifiers</td><td className="px-4 py-2 border-b">Contact details, such as real name</td><td className="px-4 py-2 border-b">YES</td></tr>
                        <tr><td className="px-4 py-2 border-b">B. Personal information (CA Civil Code)</td><td className="px-4 py-2 border-b">Name, contact information, education</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">C. Protected classification characteristics</td><td className="px-4 py-2 border-b">Gender, age, date of birth, race</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">D. Commercial information</td><td className="px-4 py-2 border-b">Transaction information, purchase history</td><td className="px-4 py-2 border-b">YES</td></tr>
                        <tr><td className="px-4 py-2 border-b">E. Biometric information</td><td className="px-4 py-2 border-b">Fingerprints and voiceprints</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">F. Internet or other network activity</td><td className="px-4 py-2 border-b">Browsing history, search history</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">G. Geolocation data</td><td className="px-4 py-2 border-b">Device location</td><td className="px-4 py-2 border-b">YES</td></tr>
                        <tr><td className="px-4 py-2 border-b">H. Audio, electronic, visual, thermal, olfactory</td><td className="px-4 py-2 border-b">Images and audio, video or call recordings</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">I. Professional or employment-related</td><td className="px-4 py-2 border-b">Business contact details</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">J. Education Information</td><td className="px-4 py-2 border-b">Student records and directory information</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">K. Inferences drawn from collected information</td><td className="px-4 py-2 border-b">Inferences drawn from any of the above</td><td className="px-4 py-2 border-b">NO</td></tr>
                        <tr><td className="px-4 py-2 border-b">L. Sensitive personal information</td><td className="px-4 py-2 border-b">N/A</td><td className="px-4 py-2 border-b">NO</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-medium text-foreground">Your Rights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You have rights under certain US state data protection laws. These rights include:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Right to know whether or not we are processing your personal data</li>
                    <li>Right to access your personal data</li>
                    <li>Right to correct inaccuracies in your personal data</li>
                    <li>Right to request the deletion of your personal data</li>
                    <li>Right to obtain a copy of the personal data you previously shared with us</li>
                    <li>Right to non-discrimination for exercising your rights</li>
                    <li>Right to opt out of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</li>
                  </ul>

                  <h3 className="text-xl font-medium text-foreground">How to Exercise Your Rights</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To exercise these rights, you can contact us by submitting a data subject access request, by emailing us at privacy@jumtunes.com, by visiting https://www.jumtunes.com/contact, or by referring to the contact details at the bottom of this document.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">California "Shine The Light" Law</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided below.
                  </p>
                </section>

                {/* Section 14 */}
                <section id="section-14" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">14. Do Other Regions Have Specific Privacy Rights?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> You may have additional rights based on the country you reside in.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Australia and New Zealand</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect and process your personal information under the obligations and conditions set by Australia's Privacy Act 1988 and New Zealand's Privacy Act 2020 (Privacy Act). This Privacy Notice satisfies the notice requirements defined in both Privacy Acts.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you do not wish to provide the personal information necessary to fulfill their applicable purpose, it may affect our ability to provide our services, in particular:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Offer you the products or services that you want</li>
                    <li>Respond to or help with your requests</li>
                    <li>Manage your account with us</li>
                    <li>Confirm your identity and protect your account</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    At any time, you have the right to request access to or correction of your personal information. You can make such a request by contacting us by using the contact details provided in the section "HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?"
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you believe we are unlawfully processing your personal information, you have the right to submit a complaint about a breach of the Australian Privacy Principles to the Office of the Australian Information Commissioner and a breach of New Zealand's Privacy Principles to the Office of New Zealand Privacy Commissioner.
                  </p>

                  <h3 className="text-xl font-medium text-foreground">Republic of South Africa</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    At any time, you have the right to request access to or correction of your personal information. If you are unsatisfied with the manner in which we address any complaint with regard to our processing of personal information, you can contact the office of the regulator:
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>The Information Regulator (South Africa)</strong><br />
                    General enquiries: enquiries@inforegulator.org.za<br />
                    Complaints: PAIAComplaints@inforegulator.org.za & POPIAComplaints@inforegulator.org.za
                  </p>
                </section>

                {/* Section 15 */}
                <section id="section-15" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">15. Do We Make Updates to This Notice?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
                  </p>
                </section>

                {/* Section 16 */}
                <section id="section-16" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">16. How Can You Contact Us About This Notice?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have questions or comments about this notice, you may email us at privacy@jumtunes.com or contact us by post at:
                  </p>
                  <address className="text-muted-foreground not-italic">
                    JumTunes<br />
                    112 Maple Ave, apt 1<br />
                    Newark, NJ 07112<br />
                    United States
                  </address>
                </section>

                {/* Section 17 */}
                <section id="section-17" className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">17. How Can You Review, Update, or Delete the Data We Collect from You?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
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
