# Tumbleweed GO - API

This repository communicates with the front-end and back-end of the Tumbleweed GO project.

## Endpoints

### /tumbleweed/upload/{latitude}/{longitude}

| Parameter       | Value    |
| :------------- | :---------- |
| Type           | `POST`        |
| Fields         | `image`: image file |
| Description | Requests to update the database with a new tumbleweed. |

### /tumbleweed/get

| Parameter       | Value    |
| :------------- | :---------- |
| Type           | `GET`        |
| Fields         | none |
| Description | Returns all tumbleweeds with their locations and predicted locations. |

### /tumbleweed/update

| Parameter       | Value    |
| :------------- | :---------- |
| Type           | `POST`        |
| Fields         | none |
| Description | Updates tumbleweed locations and predicted locations. Only updates tumbleweeds that have not been updated in a while. |
