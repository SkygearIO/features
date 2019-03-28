# Interface

## Cloud code

- id
- created_at
- created_by
- app_id
- name
- type (function, http-handler, http-service)
- trigger_type (http, cron)
- trigger_config
  - http: {src_path, target_path}
- version
- config
- status (function created, deploying, deploy failed, running, stopped)
- plan
- backend_url
- backend_type (fission, openfaas, k8s, external)
- backend_config
  - fission: {package_id, function_id, route_id}
  - openfaas: {function_id}
  - k8s: {...}

## Deploy cloud code

- Input:
  - source code files (s3 path)
  - cloud code
    - app_id
    - name
    - type
    - trigger_type
    - trigger_config
      - http: {src_path}
    - config
    - plan
- Output:
  - new cloud code

### Fission

- Create package
- Create function
- Create route

## Get cloud code

- Input:
  - cloud code id / cloud code app_id + name
- Output:
  - cloud code

## Update cloud code

- Input:
  - cloud code id / cloud code app_id + name
  - [source code files (s3 path)]
  - [config]
  - [plan]
- Output:
  - new cloud code

### Fission

- Create package if source code changed
- Create function
- Create route

## Delete cloud code

- Input:
  - cloud code id / cloud code app_id + name
- Output:
  - ok / error

### Fission

- Delete route
- Delete function
- Delete package
