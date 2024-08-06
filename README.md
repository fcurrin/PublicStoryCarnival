# StoryCarnival
Public repository for the StoryCarnival web application. This code is intended to be run on an AWS EC2 instance with appropriate permissions set to allow access to other AWS services such as Cognito, Polly, and DynamoDB.

# Running the app locally:
1. [Install Node.js](https://nodejs.org/en/download/)

2. Clone the repository. 

3. Configure the environment variables to fill in information about sensitive resources (AWS services that require credentials, etc.). There are also some constants in `app.js` that will need to be filled in. You will need to define, minimally:

```
USER_POOL_ID
REGION
COGNITO_CLIENT_ID
COGNITO_DOMAIN
COGNITO_CALLBACK_URL
SESSION_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DYNAMO_ENDPOINT
DYNAMO_LOG_TABLE
DYNAMO_USER_TABLE
SURVEY_TABLE
SURVEY_IDS
SURVEY_IDS_ES
HOME_ADDRESS
API_GATEWAY
LANDING_PAGE
RESEARCHERS
S3_BUCKET
S3_ENDPOINT
```

4. Install dependencies via
 `   $ npm install`

5. Run the app 
 `   $ node ./bin/www`