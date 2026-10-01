/**
 * Google Apps Script Web App for OldmanGoTree Publishing System
 * Target Webzine Platform: OldmanGoTree (Database-Less Webzine)
 */

// Deployment Configuration
var CONFIG = {
  ENDPOINT_URL: 'http://localhost:3000/api/publish', // Update to production URL when deployed (e.g., https://oldmangotree.media/api/publish)
  API_SECRET: 'omt_publish_token_secret_key_2026'
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('PublishForm')
    .setTitle('OldmanGoTree — AppsScript Publisher')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Publishes HTML article payload to OldmanGoTree platform API
 * Converts HTML -> .md and updates .json issue packets with schedule timestamp support
 */
function publishArticle(payload) {
  try {
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.API_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(CONFIG.ENDPOINT_URL, options);
    var statusCode = response.getResponseCode();
    var resultText = response.getContentText();
    var result = JSON.parse(resultText);

    if (statusCode === 200 || statusCode === 201) {
      return {
        success: true,
        message: result.message || 'Article successfully published!',
        article: result.article
      };
    } else {
      return {
        success: false,
        error: result.error || 'Server error (' + statusCode + '): ' + resultText
      };
    }
  } catch (err) {
    return {
      success: false,
      error: 'Google Apps Script error: ' + err.toString()
    };
  }
}
