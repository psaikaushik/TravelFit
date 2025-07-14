#ifndef UNARY_FUNCTION_FIX_H
#define UNARY_FUNCTION_FIX_H

#include <functional>

#if __cplusplus >= 201703L
// C++17 and later - unary_function was removed, provide compatibility
namespace std {
    template<class _Arg, class _Result>
    struct unary_function {
        typedef _Arg argument_type;
        typedef _Result result_type;
    };
}
#endif

#endif // UNARY_FUNCTION_FIX_H 