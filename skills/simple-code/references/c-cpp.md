Status: draft, not measured.

# C and C++

## Simple here looks like

Functions and plain structs, the standard library's containers and strings, one owner for each allocation, and `const` wherever a value does not change. Follow the project's language standard and style file (`clang-format`).

## Do

- In C++: use `std::vector`, `std::string`, `std::array` and `std::unique_ptr`; pass by `const&`; use range-based `for`.
- Own resources with RAII, so cleanup happens in destructors.
- Mark values `const` and constants `constexpr`.
- In C: keep functions small, check every return value, and name the owner of each allocation.
- Match the project's C or C++ standard, naming and header layout.

## Do not (what agents over-build here)

- Templates and inheritance for one type. Instead: the concrete type.
- A hand-written container, smart pointer or string class that the standard library has. Instead: the standard type.
- Macros for functions and constants. Instead: `inline` functions, `constexpr` or `enum`.
- Raw `new` and `delete` in C++. Instead: values and `std::unique_ptr`.
- Pointer arithmetic where indexing reads better. Instead: indexing.
- A virtual class hierarchy for one implementation. Instead: the concrete class.

## Check before finishing

- Is there a template, base class or macro here with only one user?
- Does the standard library already provide what I wrote by hand?
- Does every allocation have one clear owner?
- Does the code follow the project's standard, naming and format settings?
