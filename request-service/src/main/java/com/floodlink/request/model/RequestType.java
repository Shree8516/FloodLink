// What kind of help a citizen needs. Used by HelpRequest and sent to insights-service for priority scoring.
package com.floodlink.request.model;

public enum RequestType {
    FOOD,
    RESCUE,
    MEDICINE,
    SHELTER
}
