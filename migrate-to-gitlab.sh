#!/bin/bash

echo "🔄 Temporary Migration to GitLab"

# GitLab Configuration
GITLAB_URL="https://gitlab.com"
PROJECT_NAME="propertyark"
GITLAB_USER="your-gitlab-username"

echo "📤 Creating GitLab repository..."
# Create new project on GitLab first, then:

cd d:\real-estate-marketplace

# Add GitLab remote
git remote add gitlab git@gitlab.com:$GITLAB_USER/$PROJECT_NAME.git

# Push to GitLab
git push gitlab main

echo "✅ Repository migrated to GitLab!"
echo "🔗 GitLab URL: $GITLAB_URL/$GITLAB_USER/$PROJECT_NAME"

# Update CI/CD for GitLab
cat > .gitlab-ci.yml << EOF
stages:
  - build
  - deploy

build_frontend:
  stage: build
  script:
    - cd frontend
    - npm install
    - npm run build
  artifacts:
    paths:
      - frontend/build/

deploy_frontend:
  stage: deploy
  script:
    - echo "Deploy to your preferred platform"
    - npx vercel --prod
  only:
    - main
EOF

echo "📝 GitLab CI/CD configuration created"
