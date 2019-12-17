Glossary
========

In this document, we define a list of terms to be used in communication.

Objective
---------

In various documents, we will use different terms to refer to concepts in Skygear:
- Documentation
- Technical discussions

It would be clearer to use widely agreed terms to refer to specific concepts.

Glossory
--------
- **Skygear Cluster**: the Skygear services (Gears, Gateway, and Controller), hosted on Kubernetes.
- **Skygear Controller**: the management interface of Skygear Cluster.
- **Skygear Portal**: the web management interface of Skygear Cluster.
- **Skygear App**: a collection of microservices on Skygear Cluster, can omit 'Skygear' prefix if context if clear.
- **Skygear Gateway**: the proxy which incoming traffic to Gears and Microservices must go through.
- **Gear**: officially-supported multi-tenant-aware services.
    - **Auth Gear**
    - **Asset Gear**
- **Deployment**: a unit of executable code belong to an app.
    - **Microservices**
- **Developer**: the developer of a Skygear App.
- **User**: the user of a Skygear App.
- **Secret**: confidential key value pair belonging to an app.
- **Collaborator**: developer with management access to app.
- **App Config**: configuration to gears.
- **skygear.yaml**: configuration to deployment, including web-hooks.
- **Scaffold**: the action of initializing an empty directory using template.
- **Scaffolding Template**:
- **Access Key**:
    - **API Key**
    - **Master Key**


Misused Terms
-------------
These terms should not be used. Instead, terms from above list should be used.

**Skygear Platform**: should use Skygear Cluster.
**Project**: should use Skygear App.

Exceptions
----------

The defined terms in this document only applies to technical documents. For
other purposes, such as marketing materials, other terms may be used depending
on the situation. If any doubts, the guiding principle is to be consistent on
the term usage in related documents.
