package cm.amcloud.platform.iam.service;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach; // Import added for the new test case (disabled user)
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock; // Note: For unit tests, we focus on the service logic,
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when; // Import added for Collections.emptyList()
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager; // Static imports for JUnit assertions (e.g., assertEquals, assertNotNull)
import org.springframework.security.authentication.BadCredentialsException; // Static imports for Mockito methods (e.g., when, verify, mock, lenient)
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import cm.amcloud.platform.iam.dto.AuthRequest;
import cm.amcloud.platform.iam.dto.AuthResponse;
import cm.amcloud.platform.iam.security.JwtService;

/**
 * Unit tests for the AuthenticationService class.
 * This class uses Mockito to isolate the AuthenticationService from its dependencies
 * (AuthenticationManager and JwtService) and test its logic in isolation.
 */
@ExtendWith(MockitoExtension.class) // Integrates Mockito with JUnit 5 to enable @Mock and @InjectMocks annotations
class AuthenticationServiceUnitTest {

    @Mock // Creates a mock instance of AuthenticationManager. This mock will simulate the behavior
          // of the real AuthenticationManager without actually performing authentication against a user store.
    private AuthenticationManager authenticationManager;

    @Mock // Creates a mock instance of JwtService. This mock will simulate the JWT token generation
          // without actually creating a real JWT.
    private JwtService jwtUtil;

    @InjectMocks // Injects the mock objects (authenticationManager, jwtUtil) into this instance of
                 // AuthenticationService. This is the class under test.
    private AuthenticationService authenticationService;

    // Reusable test data
    private AuthRequest validAuthRequest;
    private AuthRequest invalidAuthRequest;
    private Authentication mockAuthentication; // A mocked Authentication object to be returned by AuthenticationManager
    private final String TEST_USERNAME = "testuser";
    private final String TEST_PASSWORD = "testpassword";
    private final String MOCKED_TOKEN = "mocked-jwt-token";
    private final List<String> USER_ROLES = Arrays.asList("ROLE_USER", "ROLE_ADMIN");
    private final List<String> EXPECTED_SCOPES = List.of("read", "write"); // Scopes hardcoded in the service

    /**
     * Sets up common test data and mock behaviors before each test method runs.
     */
    @BeforeEach
    void setUp() {
        // Clear the SecurityContextHolder before each test to prevent state leakage between tests.
        // This is crucial as SecurityContextHolder uses a ThreadLocal and can retain state.
        SecurityContextHolder.clearContext();

        // Initialize authentication request objects for testing
        validAuthRequest = new AuthRequest();
        validAuthRequest.setUsername(TEST_USERNAME);
        validAuthRequest.setPassword(TEST_PASSWORD);

        invalidAuthRequest = new AuthRequest();
        invalidAuthRequest.setUsername("wronguser");
        invalidAuthRequest.setPassword("wrongpassword");

        // Create a mock for the Authentication object that will be returned by AuthenticationManager
        mockAuthentication = mock(Authentication.class);

        // Stubbing behavior for the mockAuthentication.
        // Using lenient() to avoid UnnecessaryStubbingException if these stubs are not directly
        // invoked in certain test scenarios (e.g., when authentication fails early).
        lenient().when(mockAuthentication.getName()).thenReturn(TEST_USERNAME);
        // Simulate authorities (roles) for the authenticated user
        Collection<GrantedAuthority> authorities = USER_ROLES.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(java.util.stream.Collectors.toSet());
        lenient().when(mockAuthentication.getAuthorities()).thenAnswer(invocation -> authorities);
    }

    /**
     * Tests the successful login scenario with valid credentials.
     * Verifies that the service returns an AuthResponse with the expected JWT token
     * and that the correct methods on its dependencies were called.
     */
    @Test
    void givenValidCredentials_whenLogin_thenReturnAuthResponseWithToken() {
        // GIVEN:
        // 1. When authenticationManager.authenticate is called with the valid credentials,
        //    it should return our pre-configured mockAuthentication object.
        when(authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(TEST_USERNAME, TEST_PASSWORD)
        )).thenReturn(mockAuthentication);

        // 2. When jwtUtil.generateToken is called with the expected username, roles, and scopes,
        //    it should return our mocked token.
        when(jwtUtil.generateToken(TEST_USERNAME, USER_ROLES, EXPECTED_SCOPES))
                .thenReturn(MOCKED_TOKEN);

        // WHEN:
        // Call the login method of the service with valid credentials.
        AuthResponse response = authenticationService.login(validAuthRequest);

        // THEN:
        // 1. The response object should not be null.
        assertNotNull(response);
        // 2. The token in the response should match our mocked token.
        assertEquals(MOCKED_TOKEN, response.getToken());

        // Mockito Verifications (to ensure that the mock methods were called as expected):
        // 1. Verify that authenticationManager.authenticate was called exactly once with the correct arguments.
        verify(authenticationManager, times(1)).authenticate(
                new UsernamePasswordAuthenticationToken(TEST_USERNAME, TEST_PASSWORD)
        );
        // 2. Verify that jwtUtil.generateToken was called exactly once with the correct arguments.
        verify(jwtUtil, times(1)).generateToken(TEST_USERNAME, USER_ROLES, EXPECTED_SCOPES);

        // Verify that SecurityContextHolder was updated with our mockAuthentication.
        // While this is a unit test, verifying interaction with static context is sometimes useful.
        assertEquals(mockAuthentication, SecurityContextHolder.getContext().getAuthentication());
    }

    /**
     * Tests the login scenario with invalid credentials.
     * Verifies that the service throws a BadCredentialsException
     * and that JWT generation is not attempted.
     */
    @Test
    void givenInvalidCredentials_whenLogin_thenThrowBadCredentialsException() {
        // GIVEN:
        // When authenticationManager.authenticate is called with invalid credentials,
        // it should throw a BadCredentialsException.
        when(authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(invalidAuthRequest.getUsername(), invalidAuthRequest.getPassword())
        )).thenThrow(new BadCredentialsException("Invalid credentials"));

        // WHEN & THEN:
        // Expect that calling the login method with invalid credentials throws a BadCredentialsException.
        assertThrows(BadCredentialsException.class, () -> {
            authenticationService.login(invalidAuthRequest);
        });

        // Mockito Verifications:
        // 1. Verify that authenticationManager.authenticate was called exactly once.
        verify(authenticationManager, times(1)).authenticate(
                new UsernamePasswordAuthenticationToken(invalidAuthRequest.getUsername(), invalidAuthRequest.getPassword())
        );
        // 2. Verify that jwtUtil.generateToken was NOT called (because authentication failed).
        verifyNoInteractions(jwtUtil);
        // 3. Verify that SecurityContextHolder was NOT updated (because authentication failed).
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    /**
     * Tests the login scenario where the authenticated user has no roles assigned.
     * Verifies that the service still generates a token, but with an empty list of roles.
     */
    @Test
    void givenUserWithNoRoles_whenLogin_thenReturnAuthResponseWithTokenAndEmptyRoles() {
        // GIVEN:
        // Create a mock Authentication object that simulates a user with no roles.
        Authentication mockAuthenticationNoRoles = mock(Authentication.class);
        lenient().when(mockAuthenticationNoRoles.isAuthenticated()).thenReturn(true);
        lenient().when(mockAuthenticationNoRoles.getName()).thenReturn(TEST_USERNAME);
        lenient().when(mockAuthenticationNoRoles.getAuthorities()).thenReturn(Collections.emptyList()); // No roles

        // When authenticationManager.authenticate is called, it should return this user with no roles.
        when(authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(TEST_USERNAME, TEST_PASSWORD)
        )).thenReturn(mockAuthenticationNoRoles);

        // When jwtUtil.generateToken is called, it should be invoked with an empty list of roles.
        when(jwtUtil.generateToken(TEST_USERNAME, Collections.emptyList(), EXPECTED_SCOPES))
                .thenReturn(MOCKED_TOKEN);

        // WHEN:
        AuthResponse response = authenticationService.login(validAuthRequest);

        // THEN:
        assertNotNull(response);
        assertEquals(MOCKED_TOKEN, response.getToken());

        // Mockito Verifications:
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        // Ensure generateToken was called with an empty list of roles
        verify(jwtUtil, times(1)).generateToken(TEST_USERNAME, Collections.emptyList(), EXPECTED_SCOPES);
        assertEquals(mockAuthenticationNoRoles, SecurityContextHolder.getContext().getAuthentication());
    }

    /**
     * Tests the login scenario where the user account is disabled.
     * Verifies that the service throws a DisabledException.
     */
    @Test
    void givenDisabledUser_whenLogin_thenThrowDisabledException() {
        // GIVEN:
        // When authenticationManager.authenticate is called, it should throw a DisabledException.
        when(authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(TEST_USERNAME, TEST_PASSWORD)
        )).thenThrow(new DisabledException("User account is disabled"));

        // WHEN & THEN:
        // Expect that calling the login method throws a DisabledException.
        assertThrows(DisabledException.class, () -> {
            authenticationService.login(validAuthRequest);
        });

        // Mockito Verifications:
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verifyNoInteractions(jwtUtil); // Ensure jwtUtil was not called
        assertNull(SecurityContextHolder.getContext().getAuthentication()); // Security context should not be updated
    }
}
