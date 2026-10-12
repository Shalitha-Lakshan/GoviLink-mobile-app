# GoviLink: Business Pitch and Presenter Guide

BSc (Hons) in Information Technology · Software Engineering, Year 3  
SE3050 – User Experience Engineering · Semester 2, 2026 · Lab sheet 10  
Prepared: 12 October 2026  
**Student names, IDs and group: add before submission.**

## How to use this package

The PowerPoint contains 16 presentation slides plus two appendix slides for questions and references. Aim for approximately 6–7 minutes, then questions. Speaker notes appear inside the PowerPoint. This guide expands the business assumptions and gives a script, practice plan and follow-up template.

GoviLink is a student app prototype. Pilot partners, customers, pricing and operating costs in this proposal are **plans or assumptions**, not established results. Demo screenshots contain sample data. Public statistics provide context and do not establish demand for GoviLink. Contact and download details remain unconfirmed, so no working download link is claimed.

## 1. Problem and proposed solution

Perishable produce requires timely coordination between growers, buyers and transport providers. A farmer needs to communicate what is available, in what quantity, at what price and on which date. Buyers need enough confidence in supply to plan purchases. Drivers need clear pickup and destination details, handling instructions and an understandable record of their delivery work. When these details become fragmented, both sides may spend time confirming the same information.

FAO documents quality and quantity losses in traditional fruit and vegetable supply chains in South Asia, including cases in Sri Lanka [3]. GoviLink’s specific hypotheses about sourcing effort, missed orders and coordination delays require customer interviews. The app cannot by itself solve inadequate storage, poor packaging or physical transport damage.

GoviLink serves three core app roles: **farmer, buyer and driver**. Farmers publish and fulfil harvest supply, buyers source produce and place orders, and drivers manage vehicles and delivery progress. Their connected workflows cover harvest listings, buyer requests, order progress and delivery coordination. The intended benefits are less repeated coordination and clearer commitments. Better farmer income, lower buyer costs and reduced waste are possible outcomes to measure, not promised improvements.

## 2. Market evidence and target audience

The Department of Census and Statistics reported **2,104,353 people employed in agriculture, or 25.7% of employment, in Q2 2025** [1]. Its January–June 2025 computer literacy bulletin reported **70.8% digital literacy among people aged 5–69** [2]. These national indicators show a relevant economic sector and digital context. They do not count prospective app users, prove farmer smartphone ownership or measure willingness to pay.

The proposed first segment is adult small and medium vegetable growers in Nuwara Eliya and recurring business buyers on one practical delivery route. Include all genders and recruit both confident smartphone users and people needing help. Do not assume a specific age distribution without local research.

| Segment | Needs and preferences to test | Likely behaviour to investigate |
|---|---|---|
| Vegetable growers | Simple listings, clear quantities and prices, preferred language, assisted setup | Own/shared phone access, selling through existing relationships, seasonal supply |
| Grocers, restaurants and small wholesalers | Repeat supply, understandable total cost, predictable collection | Purchase frequency, minimum order sizes, supplier switching and payment practices |
| Drivers and vehicle owners | Vehicle management, clear jobs, pickup and destination details, delivery updates and earnings records | Route coverage, capacity, availability, fuel/time costs and payment expectations |

These are recruitment hypotheses. Conduct 15 farmer, 10 buyer and 5 driver interviews. Ask respondents to describe their **last actual transaction** before showing the app. Record time spent coordinating, cancellations, payment terms, device access and language preference. Then test five users in each role: farmers list a harvest and respond to demand, buyers find produce and submit an order or request, and drivers manage a vehicle and update a delivery. Measure task completion and errors separately for each role. Obtain consent and avoid collecting unnecessary personal data.

To size the reachable market, count farms growing the selected crops within the route, then verify how many can participate and how often they sell. Count recurring buyers and their purchase volumes separately. Estimate achievable orders from observed supply and buyer demand. Do not multiply all agricultural employment by a subscription price and call it the market size.

## 3. Product status and unique selling proposition

**Proposed USP:** GoviLink connects farmers, buyers and drivers through linked harvest, procurement and delivery workflows for local produce trading.

The repository includes harvest creation and editing, buyer requests, accepted-order management, order status handling, driver assignment, profiles and language-selection infrastructure. The farmer interface includes a bottom navigation bar and a harvest popup. Some Sinhala and Tamil text exists, but complete translation coverage needs an audit.

### Farmer journey

1. Create or update a harvest listing with photo, quantity, price and harvest date.
2. Review buyer requests and identify demand the farm can fulfil.
3. Manage accepted orders and prepare the produce for handover.
4. Follow order completion and coordinate with the buyer and delivery service.

**Intended value:** clearer demand and commitments, with less repeated coordination.

### Buyer journey

1. Browse listings, search for produce, filter by category or district, and sort by price or stock.
2. View harvest details and place a direct order with quantity and delivery information.
3. Alternatively, post a custom produce requirement with region, quantity and dates for farmers to review.
4. Review orders and delivery-status details as fulfilment progresses.

**Intended value:** easier sourcing, clearer requirements and visibility of order progress. The current direct-order prototype uses a fixed delivery fee. Route-based commercial quotes remain a proposal.

### Driver journey

1. Register and manage vehicles, choose an active vehicle and use the dashboard duty control.
2. Review delivery jobs with farmer contact details, pickup location, buyer destination and handling notes.
3. Report pickup by progressing a job to in transit, then mark it delivered after handover.
4. Review completed deliveries and the dashboard earnings summary.

**Intended value:** clearer delivery tasks and a record of work. An earnings display or success message is not evidence of an actual payment transfer. The prototype does not establish automated route optimization or verified GPS tracking. Duty-based dispatch behaviour and driver-specific order access also need validation.

### Shared transaction example

A farmer lists carrots. A buyer searches the marketplace and requests a quantity with a delivery destination. The farmer prepares the agreed produce, and a coordinator arranges a driver through the assignment workflow. The driver reviews the job, reports pickup and marks delivery. Farmer and buyer can follow order progress. Alternatively, the buyer can start with a custom request that a farmer accepts. If the buyer selects self-pickup where supported, the transaction does not require driver delivery.

The handoff is the central product story: **farmer supplies, buyer purchases, driver transports**. The administrator/coordinator supports assignment and exceptions. Payment reconciliation is a separate commercial process that still requires validation.

A working prototype does not establish production readiness. Payment settlement, commission collection, dispute handling, complete localization, security review and field reliability need further work or validation. No verified user count, revenue, signed partnership or measured impact was supplied. Before a field pilot, validate role-specific order access, status transitions, dispatch behaviour and payment reconciliation.

The proposed advantage depends on execution: a useful workflow, reliable local partners and responsive support. Direct farmer-to-buyer trading is not a new or exclusive concept.

## 4. Competitive analysis

| Alternative | Evidence | Implication for GoviLink |
|---|---|---|
| Govi Mithuru | Dialog’s app listing describes advisory information and agricultural alerts [4]. | Focus the pitch on coordinating trades. Do not claim competing services lack features without checking. |
| Govipola | CBSL’s 2019 report describes market linkages and supply–demand matching [5]. | Acknowledge a direct marketplace precedent. Its current availability, pricing and full feature set remain unverified. |
| Phone calls and messaging | A plausible existing workflow to examine in interviews. | Compare time, clarity and repeat use against customers’ actual practices. |

Before a launch decision, test currently available competitor products and interview their users. Compare task completion, active supply in the pilot region, delivery support, total charges and customer service. Avoid a comparison table full of unsupported feature absences.

## 5. Monetization strategy

Basic access would be free for farmers, buyers and drivers. There is no proposed driver subscription during the pilot. After an introductory fee waiver, test a **3% seller fee on completed, settled produce orders**, disclosed before the seller accepts. Cancelled orders generate no fee. Delivery would have a separate buyer quote and payment to the delivery partner. Delivery charges would fund driver compensation under agreed terms. They are separate from the platform produce fee, and delivery pass-through is excluded from the platform revenue examples. Driver net earnings must account for time, fuel and vehicle costs. Do not promise a guaranteed income.

Commission collection requires a workable settlement and reconciliation process. This is proposed commercial functionality, not a verified live payment service. If the platform only introduces people and cannot verify settlement, commission leakage could make this model impractical.

| Model | Decision and reason |
|---|---|
| Completed-order fee | Initial proposal because charges relate to successful trade. Test acceptance and collection cost. |
| Subscription / freemium | Possible later buyer tools for recurring procurement and reporting. Validate demand before development. |
| Paid promotion / in-app purchases | Defer until there is enough demand and ranking can remain transparent. |
| Advertising | Defer because early revenue may be small and intrusive ads can weaken trust. |

## 6. Expanded business model canvas

| Canvas block | Proposed GoviLink model |
|---|---|
| Customer segments | Three core user groups: small and medium vegetable growers; business buyers such as grocers, restaurants and wholesalers; and drivers/vehicle owners. Drivers also act as delivery partners. |
| Value proposition | Farmers gain visibility of demand; buyers gain sourcing and order tools; drivers gain vehicle and delivery workflows. All roles share clearer order handoffs. |
| Channels | Farmer groups and cooperatives, buyer visits, driver-owner networks, assisted demonstrations and referrals. App-store distribution after readiness checks. |
| Customer relationships | Role-specific onboarding, language support, recurring buyer assistance, driver trip support and a clear dispute process. |
| Revenue streams | Proposed fee on completed, settled orders. Optional premium buyer tools only after demand validation. |
| Key resources | Farmer, buyer and driver app workflows; backend; product and support team; customer relationships; driver network and operating procedures. |
| Key activities | Product maintenance, onboarding all roles, matching supply and demand, coordinating drivers, reconciliation and dispute resolution. |
| Key partners | Farmer organizations, recurring buyers, local delivery operators and a suitable payment provider if integrated. None confirmed. |
| Cost structure | Hosting, software maintenance, field onboarding, customer support, payment processing, acquisition and dispute/refund provision. |

## 7. Financial scenarios and limitations

All amounts are Sri Lankan rupees. These examples illustrate how the proposed business model behaves; they are not forecasts.

- Average completed produce order: **Rs. 10,000**.
- Fee: **3%**, or **Rs. 300 per order**.
- Variable servicing allowance: **Rs. 100 per order**.
- Contribution before fixed costs: **Rs. 200 per order**.
- Monthly fixed operating allowance: **Rs. 100,000**.

| Monthly metric | Low | Base | High |
|---|---:|---:|---:|
| Completed orders | 100 | 300 | 600 |
| Produce traded | 1,000,000 | 3,000,000 | 6,000,000 |
| Fee revenue | 30,000 | 90,000 | 180,000 |
| Variable costs | 10,000 | 30,000 | 60,000 |
| Fixed costs | 100,000 | 100,000 | 100,000 |
| Simplified operating result | −80,000 | −40,000 | 20,000 |

**Formula:** operating result = orders × (average order value × fee rate − variable cost per order) − fixed costs.

Simplified break-even is **100,000 ÷ 200 = 500 orders per month**. At Rs. 200 variable cost per order, contribution falls to Rs. 100 and break-even becomes 1,000 orders. At a 2% fee with the original cost assumptions, break-even also becomes 1,000 orders.

These examples exclude initial development, founder compensation, tax, delivery pass-through and exceptional refunds. The Rs. 100 allowance must be replaced with measured support, reconciliation and payment costs. Additional fixed costs increase break-even. Fee waivers generate no commission revenue, so the first pilot month will require funding or in-kind support. A funding amount should follow a costed plan, not these simplified scenarios.

## 8. Pilot, growth and measurement

The proposed 90-day pilot starts with discovery and route validation, proceeds to assisted onboarding and limited transactions, and ends with an evaluation. Recruitment targets by day 90 are 100 registered farmers, 30 registered buyers and 5 active drivers. An active driver completes at least one pilot delivery in the measurement month. Target 100 completed orders in the third month. These are goals, not existing traction.

| Metric | Definition | Proposed decision rule |
|---|---|---|
| Accepted-order completion | Completed orders divided by accepted orders whose planned handover date has passed | At least 80% |
| 30-day buyer repeat | Buyers placing another completed order within 30 days of their first, among buyers with a full observation window | At least 30% |
| Contribution per order | Collected platform fee minus attributable variable costs | Positive after the fee trial |
| Coordination effort | Reported time and calls/messages per transaction, compared with pre-pilot behaviour | Demonstrable improvement, threshold set after baseline |
| Quality and delivery | Complaints, rejected quantities and late handovers | Review weekly and resolve causes before expansion |
| Driver pickup timeliness | Pickups completed within the agreed time window divided by scheduled pickups | Establish a route baseline and agree a target before expansion |
| Driver economics | Delivery compensation minus fuel and attributable vehicle costs, considered alongside working time | Validate acceptable net earnings with participating drivers |

Separate registrations from active users and completed transactions. Record reasons for cancellations. Farmer net proceeds should account for fees and delivery costs before comparison with the farmer’s previous selling method. Any waste claim should measure rejected or unsold quantities using a defined baseline and comparable crops.

Expand to a second route only after meeting reliability and repeat-purchase targets with workable unit economics. Add crops or locations gradually. Proposed acquisition channels include cooperative demonstrations, direct visits to repeat buyers and referrals after successful orders. Measure acquisition cost rather than assume referrals are free.

## 9. Presentation script

### Opening and problem — slides 1–2

Good morning. We are presenting GoviLink, a mobile app prototype connecting Sri Lankan farmers, produce buyers and drivers through linked trading and delivery workflows.

A farmer may have a harvest ready to sell while a buyer is still trying to confirm availability. Both need to agree on quantity, price and timing. Our question is whether a shared workflow can reduce the effort of coordinating these transactions. GoviLink aims to make those details easier to communicate and follow through.

### Market and users — slides 3–4

National data shows why this is a relevant area to explore, but it does not prove that people will use our app. We therefore propose starting with vegetable growers in Nuwara Eliya and business buyers along one practical delivery route. We will interview farmers, buyers and drivers about their recent transactions and test the app with them before expanding.

### All three product journeys — slides 5–8

The farmer journey begins with publishing a harvest. Farmers share quantity, price and timing, review buyer requests and manage the orders they can fulfil.

The buyer has a separate journey. Buyers can browse and filter produce, place an order with a destination, or post a custom requirement for farmers to respond to. They can then follow their orders and delivery status.

The driver is also a core app user. Drivers manage their vehicles, review pickup and destination information and update a job as produce moves from pickup to delivery. The dashboard also provides a summary of completed work. That summary is not proof of a payment transfer.

These journeys meet at the same order. The farmer prepares the produce, the buyer specifies what is needed, and the driver handles transport when delivery is required. A coordinator supports driver assignment. This connected handoff is the main value we want to test.

### Positioning and competition — slides 9–10

Agricultural apps already exist. Govi Mithuru provides advisory services, and Govipola is a documented marketplace precedent. Our proposed advantage is a connected experience for the farmer, buyer and driver, supported by dependable local operations. We must prove that all three groups find it useful enough to return.

### Business model — slides 11–12

We propose free basic access for all three roles, with no driver subscription during the pilot. After a free introductory period, we would test a three-percent fee on completed and settled produce orders. Delivery would have a separate quote to fund the driver’s work under agreed terms. We will explain fees before acceptance and test whether the value justifies the charge.

Our business model brings together growers, recurring buyers and local delivery partners. The main activities are onboarding, maintaining the app and supporting orders. Our main costs include hosting, customer support and field operations.

### Pilot, economics and risks — slides 13–15

The proposed pilot lasts ninety days. By the end, we aim to recruit one hundred farmers, thirty buyers and five active drivers, with one hundred completed orders in month three. We will evaluate order completion, repeat purchasing, pickup timeliness and the economics of both platform operations and driver work.

Our financial examples are assumptions. At a ten-thousand-rupee average order and a three-percent fee, platform revenue is three hundred rupees per order. If variable costs are one hundred rupees, contribution is two hundred. With one hundred thousand rupees in monthly fixed costs, simplified break-even is five hundred orders. Setup costs and founder compensation would require additional funding.

The biggest risks are insufficient matching demand, quality disputes and unreliable delivery. We propose recruiting repeat buyers early, agreeing produce grades and limiting delivery coverage while the service is being tested.

### Closing — slide 16

We are seeking introductions to one farmer organization, ten recurring produce buyers and five pilot drivers. The next step is a discovery meeting to agree a route, responsibilities and measurable outcomes. Our goal is to establish whether GoviLink can make local produce trading easier and dependable enough for repeat use. Thank you.

## 10. Likely questions and suggested answers

**Is GoviLink only for farmers?**  
No. Farmers publish and fulfil harvest supply, buyers find produce and place orders or custom requests, and drivers manage vehicles and delivery progress. The app connects these three journeys.

**How do drivers benefit and earn money?**  
The proposed benefit is clearer job information and a record of completed deliveries. Delivery charges would fund driver compensation under agreed terms, separate from the platform’s produce commission. Net earnings and settlement still need validation.

**Does every buyer order require a driver?**  
No. Delivery jobs require driver coordination, but buyer self-pickup is an alternative where selected. We should test both paths during the pilot.

**Is it live GPS tracking or automated dispatch?**  
The repository contains order/delivery status views and assignment-related workflows. We should not claim verified live GPS tracking, automatic route optimization or fully operational dispatch based on interface labels alone.


**Why would users switch from phone calls or messaging?**  
They may not unless the shared workflow saves effort or helps orders succeed. The pilot will compare actual transaction steps and repeat use with current practices.

**What makes the app different from Govipola?**  
Marketplace matching is not exclusive to GoviLink. Our proposed focus is a consistent workflow with delivery coordination on a limited route. We need a current competitor review and customer evidence before claiming superiority.

**Do you have users or revenue already?**  
No verified commercial traction is included in this pitch. Screenshots use sample data, and pilot figures are targets.

**Will farmers accept a 3% fee?**  
We do not know yet. We will test value and willingness to pay after the introductory period, disclose the fee clearly and change the model if it prevents adoption.

**How will you collect the fee?**  
A settlement and reconciliation process is required before charging. We must choose a workable arrangement with a payment provider or controlled reconciliation process. The current prototype should not be presented as a production settlement system.

**What stops people trading outside the platform?**  
Nothing guarantees retention. Helpful order records, support and delivery coordination may encourage continued use. We will measure leakage and consider a different revenue model if commissions cannot be collected sustainably.

**How do you guarantee freshness?**  
We cannot guarantee it through software alone. We propose agreed quality standards, quantity confirmation and handover evidence, backed by a defined dispute process and suitable handling practices.

**How can farmers with limited digital skills participate?**  
Through assisted onboarding and usability testing in their preferred language. Device access and translation coverage need validation. Offline support is not a verified current capability.

**Can the business become profitable?**  
It depends on order volume, realised fees and actual costs. Our scenarios show the relationship, not proof of profitability. We must replace every assumption with pilot evidence.

**What about scalability?**  
The app and cloud backend provide a starting point, but operational support, permissions, data queries and delivery capacity need testing. We propose controlled expansion by route after meeting service and economic targets.

**How much investment are you asking for?**  
At this stage we are requesting pilot access and operational mentorship. We will prepare a funding request after obtaining actual development, support and fieldwork estimates. No funding commitment is implied.

**Will this reduce waste or increase farmer income?**  
Those are intended outcomes to test. We will track unsold or rejected produce and farmer net proceeds with a defined baseline. We should not claim a percentage improvement before measurement.

## 11. Rehearsal and delivery plan

1. Add student names, IDs, presenter allocation and a real contact channel. Confirm the instructor’s time limit.
2. Read the script aloud and time it. Use the 16 main slides, keeping the Q&A and sources as appendices.
3. Rehearse using only the slide headings. Explain the financial formula without reading all table values.
4. Ask a peer to repeat the problem, target customer, fee model and partnership request. Rewrite anything they misunderstand.
5. Practise the questions above. Keep answers under about 30 seconds and say when something is still a hypothesis.
6. Test the presentation on the classroom display. Use screenshots as a backup if a live demo fails.
7. During delivery, face the audience, maintain eye contact and pause after key numbers. End with the specific pilot request.

Suggested peer feedback: Was the problem clear? Were the farmer, buyer and driver roles clear? Could you distinguish existing features from proposals? Were assumptions credible? Was the final request actionable?

## 12. Follow-up plan and reusable message

Within two working days, send interested stakeholders the deck and a brief summary of the pilot request, with their permission. Offer a short discovery meeting. Record interest, responsibilities, open questions and an agreed next step. Follow up once after about a week if appropriate. No messages have been sent as part of preparing this package.

**Subject: GoviLink pilot discussion**

Hello [Name],

Thank you for discussing GoviLink with us. We are exploring a 90-day pilot to connect vegetable growers with recurring business buyers and local delivery partners.

We would appreciate a short meeting to understand your current process and discuss whether a pilot on one route would be useful. We can share the prototype and agree what success would look like before making commitments.

Would [proposed time] suit you for a 20-minute discussion?

Kind regards,  
[Student/team name]  
[Contact details]

## References

Accessed 12 October 2026. Statistics refer to the periods shown and are not presented as the latest releases.

1. Department of Census and Statistics. *Sri Lanka Labour Force Survey, Quarterly Bulletin, Q2 2025*, Table 5. [Publication](https://www.statistics.gov.lk/Resource/en/LabourForce/Bulletins/LFS_Q2_Bulletin_2025.pdf).
2. Department of Census and Statistics. *Computer Literacy Statistics, January–June 2025*. [Publication](https://www.statistics.gov.lk/Resource/en/ComputerLiteracy/Bulletins/2025-FirstSixMonths.pdf).
3. Food and Agriculture Organization. *Case studies on managing quality, assuring safety and reducing post-harvest losses in fruit and vegetable supply chains in South Asian countries*. [Publication page](https://www.fao.org/family-farming/detail/en/c/1756714/).
4. Dialog Axiata. *Govi Mithuru*, official developer listing on Google Play. [App listing](https://play.google.com/store/apps/details?id=com.arimaclanka.android.govimithuru).
5. Central Bank of Sri Lanka. *Annual Report 2019*, Box 4, discussion of agricultural technology and Govipola. Historical evidence only. [Publication](https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/publications/annual_report/2019/en/13_Box_04.pdf).

Product evidence: the GoviLink project’s farmer, buyer, driver and delivery components, its Firebase service functions, and local demonstration screenshots. Repository implementation supports prototype feature descriptions, not claims about production performance or commercial results.
