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
  - Add `attn/Portal` if the feature include changes from Skygear.io portal, and require UI/UX design.

For the workflow labels, here are the meaning:

- `workflow/spec-needed` - When someone is working on the design specification
- `workflow/spec-review-needed` - When this issue design specification is under review
- `workflow/design-complete` - When the design specification have been approved.
- `workflow/WIP` - When someone is actively working on the code.
- `workflow/code-complete` - When all PR have been merged.
- `workflow/guides-complete` - When all guides PR have been merged.
