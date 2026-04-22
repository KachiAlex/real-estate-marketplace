# Bugfix Requirements Document

## Introduction

The "Call Vendor" button in the PropertyDetail.js component attempts to open a phone dialer using `tel:` links, but this functionality is not working reliably across different platforms and browsers. Users on desktop browsers cannot easily call vendors, and the current implementation lacks proper UI feedback and fallback options. This bugfix introduces a modal-based phone dialer interface that provides platform-specific actions: phone calling on mobile devices and phone number copying on desktop browsers.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the "Call Vendor" button on a property detail page THEN the system attempts to open a phone dialer using a `tel:` link, but this fails silently on desktop browsers without providing any feedback or alternative action

1.2 WHEN a user on a desktop browser clicks the "Call Vendor" button THEN the system provides no way to copy the vendor's phone number or access it for manual dialing

1.3 WHEN the vendor's phone number is not available in the property data THEN the system shows a generic error message without clearly indicating what information is missing

### Expected Behavior (Correct)

2.1 WHEN a user clicks the "Call Vendor" button THEN the system SHALL display a modal dialog showing the vendor's phone number in a clear, readable format

2.2 WHEN a user on a mobile device views the phone dialer modal THEN the system SHALL display a "Call" button that opens the phone dialer using the `tel:` protocol

2.3 WHEN a user on a desktop browser views the phone dialer modal THEN the system SHALL display a "Copy Number" button that copies the vendor's phone number to the clipboard with visual confirmation

2.4 WHEN a user clicks the "Call" button on mobile THEN the system SHALL open the device's native phone dialer with the vendor's phone number pre-filled

2.5 WHEN a user clicks the "Copy Number" button on desktop THEN the system SHALL copy the phone number to clipboard and show a success toast notification

2.6 WHEN the vendor's phone number is not available THEN the system SHALL display a clear error message in the modal explaining that the phone number is not available and suggesting the "Contact Vendor" option instead

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks the "Contact Vendor" button THEN the system SHALL CONTINUE TO display the contact vendor modal for sending messages

3.2 WHEN a user successfully initiates a call inquiry THEN the system SHALL CONTINUE TO create an inquiry record in localStorage with type 'call'

3.3 WHEN a user cancels the phone dialer modal THEN the system SHALL CONTINUE TO close the modal without creating any inquiry records

3.4 WHEN a property has no vendor information THEN the system SHALL CONTINUE TO show appropriate error messages for all vendor-related actions

3.5 WHEN a user is not authenticated THEN the system SHALL CONTINUE TO redirect to login before allowing any vendor contact actions
