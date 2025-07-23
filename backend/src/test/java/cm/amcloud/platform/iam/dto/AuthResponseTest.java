package cm.amcloud.platform.iam.dto;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

public class AuthResponseTest {
	@Test
	public void AuthResponse() {
		String accessToken = "abc";
		AuthResponse expected = new AuthResponse("abc");
		AuthResponse actual = new AuthResponse(accessToken);

		assertEquals(expected, actual);
	}
}
