# chinesenotes-frontend - Under Construction
The frontend for a Chinese-English dictionary. New implementation of the web application supporting chinesenotes.com, ntireader.org, and hbreader.org.

## Development
 Run the dev server with 
 
 ```shell
 npm run dev
 ```
 
 and open http://localhost:3000.

 The web app supports different themes for the different websites. To set the theme:

 ```shell
 cp .env.local.example .env.local
 ```

 and set the SITE_THEME variable.

 ## Deployment

 These are the instructions for deployment to Google Cloud Run.

 Check the gcloud configuration:

 ```shell
gcloud config list
```

Make a new configuration called `chinesenotes-demo`:

```shell
gcloud config configurations create chinesenotes-demo
```

List configurations:

```shell
gcloud config configurations list
```

Activate it:

```shell
gcloud config configurations activate chinesenotes-demo
```

Initialize the settings:

```shell
gcloud init
```

Build the full dictionary locally before deploying (requires the
`../chinesenotes.com` repo to be checked out alongside this one):

```shell
node scripts/copy-dictionary.mjs
```

This writes `data/dictionary.json` from the chinesenotes.com TSV. The
`.gcloudignore` file keeps `data/` out of `.gitignore` exclusions so
Cloud Build receives the pre-built dictionary. Without this step Cloud
Build would fall back to the small example dictionary.

Deploy the app to Cloud Run:

```shell
SERVICE=chinesenotes-demo
REGION=us-central1
gcloud run deploy --platform=managed $SERVICE \
  --source . \
  --region=$REGION \
  --allow-unauthenticated
```
