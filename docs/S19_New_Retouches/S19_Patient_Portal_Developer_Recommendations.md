# **S19 Patient Portal - Developer Recommendations** 

Purpose: improve clarity, patient guidance, booking, consent, and care follow-up without changing the overall design. 

## **Priority Improvements** 

|**Priority**|**Issue observed**|**Recommended change**|
|---|---|---|
|HIGH|Booking asks patients to choose a "Doctor," but<br>listed options include assistants, a health coach,<br>and a nurse. Some staff titles are in French while<br>the interface is English.|Rename to "Care professional." Add a short role description<br>for each person. Make the initial clinical consultation option<br>very clear.|
|HIGH|Booking does not clearly show consultation fee,<br>expected duration, timezone, or whether<br>confirmation is required.|Show fee, duration, timezone, consultation type, and whether<br>the booking is confirmed immediately or requires clinic<br>approval before submission.|
|HIGH|Testimonial form has no visible<br>publication-consent checkbox or preview of how<br>patient details will appear.|Add an explicit consent checkbox, a publication preview, and<br>a clear contact/withdrawal process.|
|HIGH|Testimonials start with 5 stars already selected<br>and labelled "Excellent."|Start with no rating selected. Patients should actively choose<br>their rating.|
|HIGH|Dashboard top cards emphasize orders,<br>messages, stories, and verification instead of the<br>patient's next care action.|Prioritize: next appointment, today's tasks, readings due, refill<br>date, outstanding payment, and pending tests where<br>applicable.|
|MEDIUM|Empty clinical sections mainly say information will<br>appear later.|Give a clear next step: complete profile, book assessment,<br>upload requested documents, or contact the care team.|
|MEDIUM|Appointments briefly showed "Online booking is<br>not available right now" before the booking form<br>loaded.|Use a loading indicator while availability is loading. Show the<br>unavailable message only after a confirmed failure.|
|MEDIUM|New-message form does not state expected<br>response time or urgent-care guidance.|Add expected response time and a note that urgent problems<br>should not wait for a portal reply.|
|MEDIUM|Family profiles allow spouse, parent, etc., but<br>access/consent boundaries are not clearly<br>explained.|Explain adult consent, guardian access, and what information<br>linked family members can view or manage.|
|MEDIUM|Identity-document upload asks for front and back<br>for NIN, passport, and birth certificate alike.|Tailor instructions by document type and briefly explain why<br>identification is required.|



## **Other Points to Verify** 

- **Your Stories:** Three testimonials appeared under different names in this account. Confirm that an ordinary patient sees 

- only their own submissions. 

- **Prescriptions vs Treatment Plan:** Clarify the difference between these two sections. 

- **Plan duration wording:** The empty treatment-plan state suggests every patient receives a 3- or 6-month plan. Confirm 

- this matches all S19 care pathways. 

• **Billing:** No dedicated billing/payment area was visible. If payments are handled inside treatment plans, make this easy for patients to find. 

## **What Already Works Well** 

- Consistent S19 branding and professional visual design. 

- Clear main navigation. 

Page 1 

- Clinic and video consultation choices. 

- Family-member selection during booking. 

- Simple message composer. 

- Current and past prescription tabs. 

- Emergency-contact fields. 

- WhatsApp notification preferences. 

**Overall recommendation:** Keep the current visual design. Focus development on making the portal tell each patient what to do next, what their care status is, and what information or action is still pending. 

Page 2 

