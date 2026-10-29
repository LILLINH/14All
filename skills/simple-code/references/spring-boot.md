Status: draft, not measured.

# Spring Boot

## Simple here looks like

A controller method that calls a Spring Data repository or a service that holds real logic, constructor injection, records for request and response bodies, and settings in `application.yml`. Read `java.md` first, or `kotlin.md` in a Kotlin project, where data classes take the place of records. If the project's written rules ask for a service layer, follow them.

## Do

- Keep controller methods short: take the input, call, return.
- Use Spring Data repository interfaces and derived query methods for reads and writes.
- Inject dependencies through a single constructor, without `@Autowired` on fields.
- Use `record` types for request and response bodies when the Java version has them.
- Read settings with `@ConfigurationProperties` or `@Value`, in the way the project does.
- Put `@Transactional` on the method that needs it, usually in a service.

## Do not (what agents over-build here)

- A service interface and an `Impl` class for each entity for plain reads. Instead: call the repository from the controller, or one concrete service where there is logic.
- `@Configuration` classes and `@Bean` methods for what a constructor does. Instead: the constructor.
- Custom auto-configuration or a starter for one project. Instead: a normal bean.
- Application events for a direct method call. Instead: the call.
- A DTO plus a mapper for each entity when a record covers it. Instead: the record.
- Aspects for the behaviour of one method. Instead: code in the method.

## Check before finishing

- Is there a service or interface that adds nothing between the controller and the repository?
- Did I add a configuration class, event or aspect with only one user?
- Are dependencies injected through the constructor?
- Does the code follow the project's package layout and naming?
