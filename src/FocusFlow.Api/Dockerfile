# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY FocusFlow.Api.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Directory for the SQLite volume
RUN mkdir -p /app/data

ENV ASPNETCORE_URLS=http://+:5111
ENV URLS=http://+:5111
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/focusflow.db"

EXPOSE 5111

ENTRYPOINT ["dotnet", "FocusFlow.Api.dll"]
