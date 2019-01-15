# Feature Tracking and Backlog

Feature tracking repo for Skygear releases

This repo only contains issues. Each issue track a new feature might be added to Skygear. Features can be voted by :thumbsup: on the issue. Feel free to suggest new feature but please looks for existing one before opening new issue.

## What is a Feature?

A feature is anything that:

- a blog post would be written about after its release
- requires multiple SDKs/components changes
- needs significant effort or changes Skygear in a significant way (ex. something that would take 10 person-weeks to implement, introduce or redesign a system component, or introduces API changes)
- users will notice and come to rely on

It is unlikely a feature if it is:
- fix a unit test or bugs
- refactoring code
- performance improvements
- adding error messages

## When to Create a New Feature Issue

Create an issue here once you:
- have written (or plan to write) the specification or design of the feature
- (optionally) have done a prototype in your own fork

## When to Comment on a Feature Issue

Please comment on the feature issue to:
- request a review or clarification on the process
- update status of the feature effort
- link to relevant issues in other repos

For discussion of details of the design or specification. Please update the issue description once it is concluded.

## What is a Meta Feature Issue?

Feature issue with "meta" label are Meta Feature Issue. It is usually when a few related requests are seen together and it span across multiple features completion to provide a workable solutions for Skygear users.

## How to use the Labels?

- For Meta Feature issues:
  - Add `meta` label if an issue is about multiple features
- For Feature issues:
  - Add the appropriate `area/` labels for which components it is related with.
  - Add `new/client` or `new/gear` labels for new features that require building a new services (gear) or client SDK, or both
  - Add `section/Core` or `section/Docs` if the features are expected to require work on development (Core), or  documentation (Docs)
  - Add `section/Portal` if the feature include changes from Skygear.io portal, and require UI/UX design.
    - The best practices is to have two separate issues for implementation of the feature on SDK and
    server, and another issue for Skygear.io portal and guides.

- Each feature issue might need spec / code / guides / UI design, so when a feature is planned for work, it should have the issues of:
   - `require/*` if a feature require spec / code / guides / UI-Design
   - `wip/*` if a feature spec / code / guides / UI-Design are WIP
   - `completed/*` when a feature's spec / code / guides / UI-Design is completed.
